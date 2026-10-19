const express = require('express');
const { getDb } = require('../db/database');
const { sanitizeString } = require('../middleware/validate');
const { requireAuth, requireSubscription } = require('../middleware/auth');

const router = express.Router();

// GET /api/documents - Search and filter documents
router.get('/', (req, res) => {
  const db = getDb();
  const q = sanitizeString(req.query.q || req.query.search);
  const jurisdiction = sanitizeString(req.query.jurisdiction);
  const state = sanitizeString(req.query.state);
  const subject = sanitizeString(req.query.subject || req.query.subject_category);
  const legalStatus = sanitizeString(req.query.legal_status || req.query.status);
  const documentType = sanitizeString(req.query.document_type || req.query.type);
  const verificationStatus = sanitizeString(req.query.verification_status);
  const sortBy = req.query.sort_by === 'publication_date_asc' ? 'd.publication_date ASC' : 'd.publication_date DESC';

  let sql = `
    SELECT 
      d.id, d.slug, d.title, d.short_title, d.document_number, d.document_type,
      d.jurisdiction, d.state, d.issuing_authority, d.subject_category,
      d.publication_date, d.effective_date, d.legal_status, d.superseded_by_id,
      d.official_source_url, d.official_citation, d.verification_status,
      d.last_verified_date, d.missing_fields, d.summary, d.download_url,
      s.title AS superseded_by_title, s.slug AS superseded_by_slug
    FROM legal_documents d
    LEFT JOIN legal_documents s ON d.superseded_by_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    sql += ` AND (
      d.title LIKE ? 
      OR d.short_title LIKE ? 
      OR d.document_number LIKE ? 
      OR d.official_citation LIKE ? 
      OR d.summary LIKE ? 
      OR d.full_text LIKE ?
    )`;
    const wildcard = `%${q}%`;
    params.push(wildcard, wildcard, wildcard, wildcard, wildcard, wildcard);
  }

  if (jurisdiction) {
    sql += ` AND d.jurisdiction = ?`;
    params.push(jurisdiction);
  }

  if (state && state !== 'All') {
    sql += ` AND d.state = ?`;
    params.push(state);
  }

  if (subject && subject !== 'All') {
    sql += ` AND d.subject_category = ?`;
    params.push(subject);
  }

  if (legalStatus && legalStatus !== 'All') {
    sql += ` AND d.legal_status = ?`;
    params.push(legalStatus);
  }

  if (documentType && documentType !== 'All') {
    sql += ` AND d.document_type = ?`;
    params.push(documentType);
  }

  if (verificationStatus && verificationStatus !== 'All') {
    sql += ` AND d.verification_status = ?`;
    params.push(verificationStatus);
  }

  sql += ` ORDER BY ${sortBy}`;

  const rows = db.prepare(sql).all(...params);

  const formatted = rows.map((r) => {
    let missingFields = [];
    try {
      missingFields = JSON.parse(r.missing_fields || '[]');
    } catch {
      missingFields = [];
    }
    return {
      ...r,
      missing_fields: missingFields,
      has_missing_info: missingFields.length > 0 || !r.effective_date || r.verification_status === 'unverified',
    };
  });

  return res.json({
    total: formatted.length,
    query: {
      q,
      jurisdiction,
      state,
      subject,
      legalStatus,
      documentType,
      verificationStatus,
    },
    documents: formatted,
  });
});

// GET /api/documents/:id_or_slug - Get single document with sections & amendments
router.get('/:id_or_slug', (req, res) => {
  const db = getDb();
  const identifier = req.params.id_or_slug;

  const doc = db.prepare(`
    SELECT 
      d.*,
      s.title AS superseded_by_title, 
      s.slug AS superseded_by_slug,
      u.full_name AS verified_by_name
    FROM legal_documents d
    LEFT JOIN legal_documents s ON d.superseded_by_id = s.id
    LEFT JOIN users u ON d.verified_by_user_id = u.id
    WHERE d.id = ? OR d.slug = ?
  `).get(identifier, identifier);

  if (!doc) {
    return res.status(404).json({ error: 'NotFound', message: `Legal document '${identifier}' not found` });
  }

  // Parse missing fields JSON
  let missingFields = [];
  try {
    missingFields = JSON.parse(doc.missing_fields || '[]');
  } catch {
    missingFields = [];
  }

  // Fetch sections
  const sections = db.prepare(`
    SELECT id, section_number, title, content, order_index
    FROM document_sections
    WHERE document_id = ?
    ORDER BY order_index ASC
  `).all(doc.id);

  // Fetch amendments
  const amendments = db.prepare(`
    SELECT id, amending_act_title, notification_number, amendment_date, description, source_url
    FROM document_amendments
    WHERE document_id = ?
    ORDER BY amendment_date DESC
  `).all(doc.id);

  // Fetch superseded older documents pointing to this one
  const supersededActs = db.prepare(`
    SELECT id, slug, title, short_title, document_number, publication_date, legal_status
    FROM legal_documents
    WHERE superseded_by_id = ?
  `).all(doc.id);

  // Audit trail
  const auditLogs = db.prepare(`
    SELECT a.id, a.action, a.previous_status, a.new_status, a.notes, a.created_at, u.full_name as author_name
    FROM verification_audit_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.document_id = ?
    ORDER BY a.created_at DESC
  `).all(doc.id);

  return res.json({
    document: {
      ...doc,
      missing_fields: missingFields,
      has_missing_info: missingFields.length > 0 || !doc.effective_date || doc.verification_status === 'unverified',
      sections,
      amendments,
      superseded_acts: supersededActs,
      audit_logs: auditLogs,
    },
  });
});

// GET /api/documents/:id_or_slug/download - Official document download / plain text export
router.get('/:id_or_slug/download', (req, res) => {
  const db = getDb();
  const identifier = req.params.id_or_slug;

  const doc = db.prepare('SELECT * FROM legal_documents WHERE id = ? OR slug = ?').get(identifier, identifier);
  if (!doc) {
    return res.status(404).json({ error: 'NotFound', message: 'Document not found' });
  }

  const format = req.query.format || 'txt';

  if (format === 'official_pdf') {
    if (doc.download_url) {
      return res.redirect(doc.download_url);
    }
    return res.status(404).json({ error: 'NotFound', message: 'Official source PDF link not available' });
  }

  // Plain-text legal compilation download
  const sections = db.prepare(`
    SELECT section_number, title, content FROM document_sections WHERE document_id = ? ORDER BY order_index ASC
  `).all(doc.id);

  let compiled = `========================================================================\n`;
  compiled += `INDIA LABOUR LAW LIBRARY - OFFICIAL STATUTORY REPOSITORY\n`;
  compiled += `========================================================================\n\n`;
  compiled += `TITLE: ${doc.title}\n`;
  compiled += `CITATION: ${doc.official_citation}\n`;
  compiled += `DOCUMENT TYPE: ${doc.document_type.toUpperCase()} | JURISDICTION: ${doc.jurisdiction.toUpperCase()} (${doc.state})\n`;
  compiled += `ISSUING AUTHORITY: ${doc.issuing_authority}\n`;
  compiled += `PUBLICATION DATE: ${doc.publication_date}\n`;
  compiled += `EFFECTIVE DATE: ${doc.effective_date || 'Pending Official State/Central Gazette Notification'}\n`;
  compiled += `LEGAL STATUS: ${doc.legal_status.toUpperCase()} | VERIFICATION: ${doc.verification_status.toUpperCase()}\n`;
  compiled += `OFFICIAL SOURCE: ${doc.official_source_url}\n`;
  compiled += `\nSUMMARY:\n${doc.summary}\n`;
  compiled += `\n------------------------------------------------------------------------\n`;
  compiled += `STATUTORY TEXT:\n`;
  compiled += `------------------------------------------------------------------------\n\n`;
  compiled += doc.full_text + `\n\n`;

  if (sections.length > 0) {
    compiled += `KEY CODIFIED SECTIONS:\n`;
    for (const sec of sections) {
      compiled += `\n[${sec.section_number}: ${sec.title}]\n${sec.content}\n`;
    }
  }

  compiled += `\n========================================================================\n`;
  compiled += `Downloaded from India Labour Law Library at ${new Date().toISOString()}\n`;
  compiled += `Disclaimer: Provided for research and compliance reference. Cross-reference with egazette.gov.in.\n`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.slug}.txt"`);
  return res.send(compiled);
});

module.exports = router;
