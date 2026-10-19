const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { initDb, closeDb } = require('../db/database');
const { runSeed } = require('../db/seed');

test('Document Publication Lifecycle & Audit Log Test Suite', async (t) => {
  const db = initDb(':memory:');
  runSeed(db);

  const testDocId = 'doc_lifecycle_test_1';
  const testUserId = 'usr_admin_001';

  await t.test('1. Document begins in draft status', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO legal_documents (
        id, slug, title, short_title, document_number, document_type, jurisdiction, state,
        issuing_authority, subject_category, publication_date, effective_date, legal_status,
        superseded_by_id, official_source_url, official_citation, verification_status,
        last_verified_date, verified_by_user_id, missing_fields, summary, full_text,
        download_url, created_at, updated_at
      ) VALUES (
        ?, 'lifecycle-test-act', 'Lifecycle Test Act 2026', 'Test Act', 'Act 99 of 2026', 'act', 'central', 'Central (All India)',
        'Ministry of Labour and Employment', 'Wages & Remuneration', '2026-01-01', null, 'draft',
        null, 'https://labour.gov.in/test.pdf', 'Gazette Test Citation', 'unverified',
        null, null, '["Effective date pending notification"]', 'Test summary', 'Full statutory content',
        null, ?, ?
      )
    `).run(testDocId, now, now);

    // Initial audit log
    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'DOCUMENT_CREATED', null, 'draft', 'Created in draft status', ?)
    `).run('aud_test_1', testDocId, testUserId, now);

    const doc = db.prepare('SELECT legal_status, verification_status FROM legal_documents WHERE id = ?').get(testDocId);
    assert.strictEqual(doc.legal_status, 'draft');
    assert.strictEqual(doc.verification_status, 'unverified');
  });

  await t.test('2. Transition from draft to pending_verification', () => {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE legal_documents SET legal_status = 'pending_verification', updated_at = ? WHERE id = ?
    `).run(now, testDocId);

    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'SUBMITTED_FOR_VERIFICATION', 'draft', 'pending_verification', 'Submitted for editorial check', ?)
    `).run('aud_test_2', testDocId, testUserId, now);

    const doc = db.prepare('SELECT legal_status FROM legal_documents WHERE id = ?').get(testDocId);
    assert.strictEqual(doc.legal_status, 'pending_verification');
  });

  await t.test('3. Verification and Publication to verified status', () => {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    db.prepare(`
      UPDATE legal_documents SET
        legal_status = 'verified',
        verification_status = 'verified',
        last_verified_date = ?,
        verified_by_user_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(today, testUserId, now, testDocId);

    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'DOCUMENT_VERIFIED_AND_PUBLISHED', 'pending_verification', 'verified', 'Verified against official gazette copy', ?)
    `).run('aud_test_3', testDocId, testUserId, now);

    const doc = db.prepare('SELECT legal_status, verification_status, last_verified_date, verified_by_user_id FROM legal_documents WHERE id = ?').get(testDocId);
    assert.strictEqual(doc.legal_status, 'verified');
    assert.strictEqual(doc.verification_status, 'verified');
    assert.strictEqual(doc.last_verified_date, today);
    assert.strictEqual(doc.verified_by_user_id, testUserId);
  });

  await t.test('4. Transition to superseded status with successor link', () => {
    const now = new Date().toISOString();
    const successorId = 'doc_wage_code_2019';

    db.prepare(`
      UPDATE legal_documents SET
        legal_status = 'superseded',
        superseded_by_id = ?,
        updated_at = ?
      WHERE id = ?
    `).run(successorId, now, testDocId);

    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'DOCUMENT_SUPERSEDED', 'verified', 'superseded', 'Superseded by Code on Wages 2019', ?)
    `).run('aud_test_4', testDocId, testUserId, now);

    const doc = db.prepare('SELECT legal_status, superseded_by_id FROM legal_documents WHERE id = ?').get(testDocId);
    assert.strictEqual(doc.legal_status, 'superseded');
    assert.strictEqual(doc.superseded_by_id, successorId);
  });

  await t.test('5. Transition to archived status', () => {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE legal_documents SET legal_status = 'archived', updated_at = ? WHERE id = ?
    `).run(now, testDocId);

    db.prepare(`
      INSERT INTO verification_audit_log (id, document_id, user_id, action, previous_status, new_status, notes, created_at)
      VALUES (?, ?, ?, 'DOCUMENT_ARCHIVED', 'superseded', 'archived', 'Archived for historical records', ?)
    `).run('aud_test_5', testDocId, testUserId, now);

    const doc = db.prepare('SELECT legal_status FROM legal_documents WHERE id = ?').get(testDocId);
    assert.strictEqual(doc.legal_status, 'archived');
  });

  await t.test('6. Complete audit history is retained with chronological order', () => {
    const auditEntries = db.prepare(`
      SELECT action, previous_status, new_status, notes
      FROM verification_audit_log
      WHERE document_id = ?
      ORDER BY created_at ASC
    `).all(testDocId);

    assert.strictEqual(auditEntries.length, 5, 'Should have 5 lifecycle audit records');
    assert.strictEqual(auditEntries[0].action, 'DOCUMENT_CREATED');
    assert.strictEqual(auditEntries[1].action, 'SUBMITTED_FOR_VERIFICATION');
    assert.strictEqual(auditEntries[2].action, 'DOCUMENT_VERIFIED_AND_PUBLISHED');
    assert.strictEqual(auditEntries[3].action, 'DOCUMENT_SUPERSEDED');
    assert.strictEqual(auditEntries[4].action, 'DOCUMENT_ARCHIVED');
  });

  closeDb();
});
