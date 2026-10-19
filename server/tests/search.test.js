const test = require('node:test');
const assert = require('node:assert/strict');
const { initDb, closeDb } = require('../db/database');
const { runSeed } = require('../db/seed');

test('Search & Filter Test Suite', async (t) => {
  // Setup in-memory test database
  const db = initDb(':memory:');
  runSeed(db);

  await t.test('1. Search by keyword returns matched enactments', () => {
    const term = 'wages';
    const rows = db.prepare(`
      SELECT id, title FROM legal_documents 
      WHERE title LIKE ? OR summary LIKE ? OR full_text LIKE ?
    `).all(`%${term}%`, `%${term}%`, `%${term}%`);

    assert.ok(rows.length >= 2, 'Should find at least Code on Wages and Minimum Wages Act');
    const titles = rows.map(r => r.title);
    assert.ok(titles.some(t => t.includes('Code on Wages')), 'Should contain Code on Wages');
    assert.ok(titles.some(t => t.includes('Minimum Wages Act')), 'Should contain Minimum Wages Act');
  });

  await t.test('2. Filter by Jurisdiction (central vs state)', () => {
    const centralDocs = db.prepare('SELECT id FROM legal_documents WHERE jurisdiction = ?').all('central');
    const stateDocs = db.prepare('SELECT id FROM legal_documents WHERE jurisdiction = ?').all('state');

    assert.ok(centralDocs.length >= 8, 'Central docs should contain central codes and legacy acts');
    assert.ok(stateDocs.length >= 3, 'State docs should contain Maharashtra, Karnataka, Delhi acts');
  });

  await t.test('3. Filter by State jurisdiction', () => {
    const mahDocs = db.prepare('SELECT title FROM legal_documents WHERE state = ?').all('Maharashtra');
    const karDocs = db.prepare('SELECT title FROM legal_documents WHERE state = ?').all('Karnataka');

    assert.strictEqual(mahDocs.length, 1);
    assert.ok(mahDocs[0].title.includes('Maharashtra Shops'));
    assert.strictEqual(karDocs.length, 1);
    assert.ok(karDocs[0].title.includes('Karnataka Shops'));
  });

  await t.test('4. Filter by Legal Status (draft, pending_verification, verified, superseded, archived)', () => {
    const drafts = db.prepare('SELECT id FROM legal_documents WHERE legal_status = ?').all('draft');
    const pending = db.prepare('SELECT id FROM legal_documents WHERE legal_status = ?').all('pending_verification');
    const verified = db.prepare('SELECT id FROM legal_documents WHERE legal_status = ?').all('verified');
    const superseded = db.prepare('SELECT id FROM legal_documents WHERE legal_status = ?').all('superseded');
    const archived = db.prepare('SELECT id FROM legal_documents WHERE legal_status = ?').all('archived');

    assert.ok(drafts.length >= 1, 'Must have draft documents');
    assert.ok(pending.length >= 1, 'Must have pending verification documents');
    assert.ok(verified.length >= 8, 'Must have verified active documents');
    assert.ok(superseded.length >= 1, 'Must have superseded documents');
    assert.ok(archived.length >= 1, 'Must have archived documents');
  });

  await t.test('5. Superseded relationship resolves successor Code', () => {
    const minWages = db.prepare(`
      SELECT d.title, s.title as successor_title, s.slug as successor_slug
      FROM legal_documents d
      LEFT JOIN legal_documents s ON d.superseded_by_id = s.id
      WHERE d.id = 'doc_min_wages_1948'
    `).get();

    assert.ok(minWages, 'Document must exist');
    assert.strictEqual(minWages.successor_title, 'The Code on Wages, 2019');
    assert.strictEqual(minWages.successor_slug, 'the-code-on-wages-2019');
  });

  await t.test('6. Document sections retrieval in sequence', () => {
    const sections = db.prepare(`
      SELECT section_number, title, order_index
      FROM document_sections
      WHERE document_id = 'doc_wage_code_2019'
      ORDER BY order_index ASC
    `).all();

    assert.ok(sections.length >= 4, 'Should have multiple codified sections');
    assert.strictEqual(sections[0].section_number, 'Section 1');
    assert.strictEqual(sections[1].section_number, 'Section 2(y)');
  });

  closeDb();
});
