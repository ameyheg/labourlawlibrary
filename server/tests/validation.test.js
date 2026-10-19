const test = require('node:test');
const assert = require('node:assert/strict');
const { validateDocumentInput, isValidIsoDate, sanitizeString } = require('../middleware/validate');

test('Data Validation & Integrity Test Suite', async (t) => {
  await t.test('1. Valid document input passes validation', () => {
    const validData = {
      title: 'The Industrial Relations Code, 2020',
      short_title: 'IR Code, 2020',
      document_number: 'Act No. 35 of 2020',
      document_type: 'code',
      jurisdiction: 'central',
      state: 'Central (All India)',
      issuing_authority: 'Ministry of Labour and Employment',
      subject_category: 'Industrial Relations & Disputes',
      publication_date: '2020-09-29',
      effective_date: null,
      legal_status: 'verified',
      official_source_url: 'https://labour.gov.in/ir-code.pdf',
      official_citation: 'Gazette of India, Extraordinary, Part II',
      verification_status: 'verified',
      summary: 'Consolidates trade union and industrial disputes laws.',
      full_text: 'An Act to consolidate and amend the laws relating to Trade Unions...',
    };

    const res = validateDocumentInput(validData, false);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.sanitized.short_title, 'IR Code, 2020');
  });

  await t.test('2. Rejects missing mandatory fields (title, summary, source url, citation)', () => {
    const invalidData = {
      document_type: 'act',
      jurisdiction: 'central',
      subject_category: 'Wages & Remuneration',
      publication_date: '2025-01-01',
      legal_status: 'draft',
    };

    const res = validateDocumentInput(invalidData, false);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.includes('Title is required'));
    assert.ok(res.errors.includes('Short title is required'));
    assert.ok(res.errors.includes('Issuing authority is required'));
    assert.ok(res.errors.includes('Official source URL is required'));
    assert.ok(res.errors.includes('Summary is required'));
  });

  await t.test('3. Rejects invalid enum values for document_type, legal_status, subject_category', () => {
    const badEnums = {
      title: 'Invalid Act',
      short_title: 'Invalid',
      document_type: 'invalid_type',
      jurisdiction: 'invalid_jurisdiction',
      issuing_authority: 'Ministry of Labour',
      subject_category: 'Arbitrary Category',
      publication_date: '2025-01-01',
      legal_status: 'non_existent_status',
      official_source_url: 'https://example.com/act.pdf',
      official_citation: 'Citation 123',
      summary: 'Summary text',
      full_text: 'Full statutory text',
    };

    const res = validateDocumentInput(badEnums, false);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Document type must be one of')));
    assert.ok(res.errors.some(e => e.includes('Jurisdiction must be one of')));
    assert.ok(res.errors.some(e => e.includes('Subject category must be one of')));
    assert.ok(res.errors.some(e => e.includes('Legal status must be one of')));
  });

  await t.test('4. Enforces valid ISO YYYY-MM-DD date formats', () => {
    assert.strictEqual(isValidIsoDate('2025-08-15'), true);
    assert.strictEqual(isValidIsoDate('15/08/2025'), false);
    assert.strictEqual(isValidIsoDate('2025-13-45'), false);
    assert.strictEqual(isValidIsoDate('invalid-date'), false);
  });

  await t.test('5. Automated calculation of missing info items', () => {
    const draftData = {
      title: 'Draft State Rules',
      short_title: 'Draft Rules',
      document_type: 'rules',
      jurisdiction: 'central',
      issuing_authority: 'Ministry of Labour',
      subject_category: 'Wages & Remuneration',
      publication_date: '2020-07-07',
      effective_date: null,
      legal_status: 'draft',
      verification_status: 'unverified',
      official_source_url: 'https://labour.gov.in/draft.pdf',
      official_citation: 'GSR 432(E)',
      summary: 'Draft rule text',
      full_text: 'Full draft',
    };

    const res = validateDocumentInput(draftData, false);
    assert.strictEqual(res.isValid, true);
    assert.ok(res.missingFields.some(m => m.includes('effective enforcement date is pending')));
    assert.ok(res.missingFields.some(m => m.includes('pending gazette verification')));
    assert.ok(res.missingFields.some(m => m.includes('Subordinate rules or public comments pending')));
  });

  await t.test('6. Sanitization trims whitespace and handles non-strings safely', () => {
    assert.strictEqual(sanitizeString('   Clean Text   '), 'Clean Text');
    assert.strictEqual(sanitizeString(null), '');
    assert.strictEqual(sanitizeString(undefined), '');
  });
});
