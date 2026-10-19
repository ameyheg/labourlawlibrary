const express = require('express');
const crypto = require('node:crypto');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateDocumentInput, sanitizeString } = require('../middleware/validate');
const { createBackup } = require('../db/backup');

const router = express.Router();

// Middleware: all admin routes require 'admin' or 'editor' role
router.use(requireAuth, requireRole('admin', 'editor'));

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST /api/admin/documents - Create a new legal document
router.post('/documents', (req, res) => {
  const validation = validateDocumentInput(req.body, false);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Document validation failed',
      errors: validation.errors,
    });
  }

  const db = getDb();
  const d = validation.sanitized;
  const docId = 'doc_' + crypto.randomUUID().slice(0, 8);
  let slug = slugify(d.short_title || d.title);

  // Ensure unique slug
  let counter = 1;
  while (db.prepare('SELECT id FROM legal_documents WHERE slug = ?').get(slug)) {
    slug = `${slugify(d.short_title || d.title)}-${counter++}`;
  }

  const now = new Date().toISOString();
  const verifiedDate = d.verification_status === 'verified' ? now.slice(0, 10) : null;
  const verifiedBy = d.verification_status === 'verified' ? req.user.id : null;

  db.prepare(`
    INSERT INTO legal_documents (
      id, slug, title, short_title, document_number, document_type, jurisdiction, state,
      issuing_authority, subject_category, publication_date, effective_date, legal_status,
      superseded_by_id, official_source_url, official_citation, verification_status,
      last_verified_date, verified_by_user_id, missing_fields, summary, full_text,
      download_url, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    docId, slug, d.title, d.short_title, d.document_number, d.document_type, d.jurisdiction, d.state,
    d.issuing_authority, d.subject_category, d.publication_date, d.effective_date, d.legal_status,
    d.superseded_by_id, d.official_source_url, d.official_citation, d.verification_status,
    verifiedDate, verifiedBy, d.missing_fields, d.summary, d.full_text,
    d.download_url, now, now
  );

  // Record audit log
  const auditId = 'aud_' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
    VALUES (?, ?, ?, 'DOCUMENT_CREATED', null, ?, ?, ?)
  `).run(
    auditId,
    docId,
    req.user.id,
    d.legal_status,
    `Initial creation by ${req.user.full_name} (${req.user.role}). Verification status: ${d.verification_status}`,
    now
  );

  const createdDoc = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);
  return res.status(201).json({
    message: 'Legal document created successfully',
    document: createdDoc,
  });
});

// PUT /api/admin/documents/:id - Update existing legal document
router.put('/documents/:id', (req, res) => {
  const docId = req.params.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  const validation = validateDocumentInput(req.body, false);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Document validation failed',
      errors: validation.errors,
    });
  }

  const d = validation.sanitized;
  const now = new Date().toISOString();

  let verifiedDate = existing.last_verified_date;
  let verifiedBy = existing.verified_by_user_id;
  if (d.verification_status === 'verified' && existing.verification_status !== 'verified') {
    verifiedDate = now.slice(0, 10);
    verifiedBy = req.user.id;
  }

  db.prepare(`
    UPDATE legal_documents SET
      title = ?, short_title = ?, document_number = ?, document_type = ?,
      jurisdiction = ?, state = ?, issuing_authority = ?, subject_category = ?,
      publication_date = ?, effective_date = ?, legal_status = ?, superseded_by_id = ?,
      official_source_url = ?, official_citation = ?, verification_status = ?,
      last_verified_date = ?, verified_by_user_id = ?, missing_fields = ?,
      summary = ?, full_text = ?, download_url = ?, updated_at = ?
    WHERE id = ?
  `).run(
    d.title, d.short_title, d.document_number, d.document_type,
    d.jurisdiction, d.state, d.issuing_authority, d.subject_category,
    d.publication_date, d.effective_date, d.legal_status, d.superseded_by_id,
    d.official_source_url, d.official_citation, d.verification_status,
    verifiedDate, verifiedBy, d.missing_fields,
    d.summary, d.full_text, d.download_url, now,
    docId
  );

  // Record audit log if status changed
  if (existing.legal_status !== d.legal_status || existing.verification_status !== d.verification_status) {
    const auditId = 'aud_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'STATUS_MODIFIED', ?, ?, ?, ?)
    `).run(
      auditId,
      docId,
      req.user.id,
      `${existing.legal_status} (${existing.verification_status})`,
      `${d.legal_status} (${d.verification_status})`,
      req.body.notes || `Updated by ${req.user.full_name}`,
      now
    );
  }

  const updatedDoc = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);
  return res.json({
    message: 'Legal document updated successfully',
    document: updatedDoc,
  });
});

// POST /api/admin/documents/:id/verify - Explicit verification action
router.post('/documents/:id/verify', (req, res) => {
  const docId = req.params.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  const status = req.body.status || 'verified';
  const notes = sanitizeString(req.body.notes) || 'Verified against Gazette of India notification.';
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE legal_documents SET
      verification_status = ?,
      legal_status = CASE WHEN ? = 'verified' AND legal_status = 'pending_verification' THEN 'verified' ELSE legal_status END,
      last_verified_date = ?,
      verified_by_user_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(status, status, now.slice(0, 10), req.user.id, now, docId);

  const auditId = 'aud_' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
    VALUES (?, ?, ?, 'VERIFICATION_CONFIRMED', ?, ?, ?, ?)
  `).run(auditId, docId, req.user.id, existing.verification_status, status, notes, now);

  const updatedDoc = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);
  return res.json({
    message: `Document verification status updated to '${status}'`,
    document: updatedDoc,
  });
});

// POST /api/admin/documents/:id/publish - Explicit publication action
router.post('/documents/:id/publish', (req, res) => {
  const docId = req.params.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE legal_documents SET
      legal_status = 'verified',
      updated_at = ?
    WHERE id = ?
  `).run(now, docId);

  const auditId = 'aud_' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
    VALUES (?, ?, ?, 'DOCUMENT_PUBLISHED', ?, 'verified', ?, ?)
  `).run(
    auditId,
    docId,
    req.user.id,
    existing.legal_status,
    `Published to active library by ${req.user.full_name}`,
    now
  );

  return res.json({
    message: 'Document published successfully',
  });
});

// POST /api/admin/documents/:id/supersede - Link document to succeeding code/act
router.post('/documents/:id/supersede', (req, res) => {
  const docId = req.params.id;
  const supersededById = req.body.superseded_by_id;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM legal_documents WHERE id = ?').get(docId);
  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  if (supersededById) {
    const successor = db.prepare('SELECT id, title FROM legal_documents WHERE id = ?').get(supersededById);
    if (!successor) {
      return res.status(400).json({ error: 'ValidationError', message: 'Target succeeding document does not exist' });
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE legal_documents SET
      legal_status = 'superseded',
      superseded_by_id = ?,
      updated_at = ?
    WHERE id = ?
  `).run(supersededById, now, docId);

  const auditId = 'aud_' + crypto.randomUUID().slice(0, 8);
  db.prepare(`
    INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
    VALUES (?, ?, ?, 'DOCUMENT_SUPERSEDED', ?, 'superseded', ?, ?)
  `).run(
    auditId,
    docId,
    req.user.id,
    existing.legal_status,
    `Marked superseded by ${supersededById}`,
    now
  );

  return res.json({ message: 'Document status changed to superseded' });
});

// DELETE /api/admin/documents/:id - Delete document (Admin only)
router.delete('/documents/:id', requireRole('admin'), (req, res) => {
  const docId = req.params.id;
  const db = getDb();
  const existing = db.prepare('SELECT id, title FROM legal_documents WHERE id = ?').get(docId);

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  db.prepare('DELETE FROM legal_documents WHERE id = ?').run(docId);
  return res.json({ message: `Document '${existing.title}' deleted successfully` });
});

// POST /api/admin/backup - Trigger immediate database backup (Admin only)
router.post('/backup', requireRole('admin'), (req, res) => {
  try {
    const result = createBackup();
    return res.json({
      message: 'Database backup snapshot created successfully',
      backup: result,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'BackupError',
      message: err.message,
    });
  }
});

module.exports = router;
