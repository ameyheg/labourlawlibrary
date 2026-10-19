const VALID_DOCUMENT_TYPES = ['act', 'code', 'rules', 'notification', 'amendment'];
const VALID_JURISDICTIONS = ['central', 'state'];
const VALID_LEGAL_STATUSES = ['draft', 'pending_verification', 'verified', 'superseded', 'archived'];
const VALID_VERIFICATION_STATUSES = ['verified', 'unverified', 'disputed'];
const VALID_SUBJECTS = [
  'Wages & Remuneration',
  'Industrial Relations & Disputes',
  'Social Security & Benefits',
  'Occupational Safety & Health',
  'Shops & Commercial Establishments',
  'Contract & Migrant Labour',
  'Apprenticeship & Employment Exchanges'
];

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function isValidIsoDate(str) {
  if (!str) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime());
}

function validateDocumentInput(data, isUpdate = false) {
  const errors = [];
  const missingFields = [];

  const title = sanitizeString(data.title);
  const shortTitle = sanitizeString(data.short_title);
  const documentNumber = sanitizeString(data.document_number);
  const documentType = sanitizeString(data.document_type);
  const jurisdiction = sanitizeString(data.jurisdiction);
  const state = sanitizeString(data.state) || (jurisdiction === 'central' ? 'Central (All India)' : '');
  const issuingAuthority = sanitizeString(data.issuing_authority);
  const subjectCategory = sanitizeString(data.subject_category);
  const publicationDate = sanitizeString(data.publication_date);
  const effectiveDate = sanitizeString(data.effective_date) || null;
  const legalStatus = sanitizeString(data.legal_status);
  const supersededById = sanitizeString(data.superseded_by_id) || null;
  const officialSourceUrl = sanitizeString(data.official_source_url);
  const officialCitation = sanitizeString(data.official_citation);
  const verificationStatus = sanitizeString(data.verification_status) || 'unverified';
  const summary = sanitizeString(data.summary);
  const fullText = sanitizeString(data.full_text);
  const downloadUrl = sanitizeString(data.download_url) || null;

  if (!isUpdate || data.title !== undefined) {
    if (!title) errors.push('Title is required');
  }
  if (!isUpdate || data.short_title !== undefined) {
    if (!shortTitle) errors.push('Short title is required');
  }
  if (!isUpdate || data.document_type !== undefined) {
    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      errors.push(`Document type must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`);
    }
  }
  if (!isUpdate || data.jurisdiction !== undefined) {
    if (!VALID_JURISDICTIONS.includes(jurisdiction)) {
      errors.push(`Jurisdiction must be one of: ${VALID_JURISDICTIONS.join(', ')}`);
    }
  }
  if (jurisdiction === 'state' && !state) {
    errors.push('State name is required when jurisdiction is state');
  }
  if (!isUpdate || data.issuing_authority !== undefined) {
    if (!issuingAuthority) errors.push('Issuing authority is required');
  }
  if (!isUpdate || data.subject_category !== undefined) {
    if (!VALID_SUBJECTS.includes(subjectCategory)) {
      errors.push(`Subject category must be one of: ${VALID_SUBJECTS.join(', ')}`);
    }
  }
  if (!isUpdate || data.publication_date !== undefined) {
    if (!publicationDate || !isValidIsoDate(publicationDate)) {
      errors.push('Publication date must be a valid ISO date in YYYY-MM-DD format');
    }
  }
  if (effectiveDate && !isValidIsoDate(effectiveDate)) {
    errors.push('Effective date must be a valid ISO date in YYYY-MM-DD format');
  }
  if (!isUpdate || data.legal_status !== undefined) {
    if (!VALID_LEGAL_STATUSES.includes(legalStatus)) {
      errors.push(`Legal status must be one of: ${VALID_LEGAL_STATUSES.join(', ')}`);
    }
  }
  if (!isUpdate || data.verification_status !== undefined) {
    if (!VALID_VERIFICATION_STATUSES.includes(verificationStatus)) {
      errors.push(`Verification status must be one of: ${VALID_VERIFICATION_STATUSES.join(', ')}`);
    }
  }
  if (!isUpdate || data.official_source_url !== undefined) {
    if (!officialSourceUrl) {
      errors.push('Official source URL is required');
    } else if (!officialSourceUrl.startsWith('http://') && !officialSourceUrl.startsWith('https://')) {
      errors.push('Official source URL must begin with http:// or https://');
    }
  }
  if (!isUpdate || data.official_citation !== undefined) {
    if (!officialCitation) errors.push('Official citation is required');
  }
  if (!isUpdate || data.summary !== undefined) {
    if (!summary) errors.push('Summary is required');
  }
  if (!isUpdate || data.full_text !== undefined) {
    if (!fullText) errors.push('Full text or statutory overview is required');
  }

  // Detect missing information items for data transparency
  if (!effectiveDate) {
    missingFields.push('Official notification of effective enforcement date is pending or unspecified.');
  }
  if (!documentNumber) {
    missingFields.push('Act/Gazette registration number is unrecorded.');
  }
  if (verificationStatus === 'unverified') {
    missingFields.push('Document legal authenticity is pending gazette verification.');
  }
  if (legalStatus === 'draft') {
    missingFields.push('Subordinate rules or public comments pending formal legislative enactment.');
  }
  if (legalStatus === 'superseded' && !supersededById) {
    missingFields.push('Document marked superseded without a linked replacement Act/Code.');
  }

  // Include any custom missing fields passed
  if (Array.isArray(data.missing_fields)) {
    for (const item of data.missing_fields) {
      const clean = sanitizeString(item);
      if (clean && !missingFields.includes(clean)) {
        missingFields.push(clean);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFields,
    sanitized: {
      title,
      short_title: shortTitle,
      document_number: documentNumber,
      document_type: documentType,
      jurisdiction,
      state: state || 'Central (All India)',
      issuing_authority: issuingAuthority,
      subject_category: subjectCategory,
      publication_date: publicationDate,
      effective_date: effectiveDate,
      legal_status: legalStatus,
      superseded_by_id: supersededById,
      official_source_url: officialSourceUrl,
      official_citation: officialCitation,
      verification_status: verificationStatus,
      summary,
      full_text: fullText,
      download_url: downloadUrl,
      missing_fields: JSON.stringify(missingFields),
    },
  };
}

module.exports = {
  VALID_DOCUMENT_TYPES,
  VALID_JURISDICTIONS,
  VALID_LEGAL_STATUSES,
  VALID_VERIFICATION_STATUSES,
  VALID_SUBJECTS,
  validateDocumentInput,
  sanitizeString,
  isValidIsoDate,
};
