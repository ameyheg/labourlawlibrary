const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// GET /api/stats - Transparent library metrics & verification coverage
router.get('/', (req, res) => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM legal_documents').get().count;

  const byStatus = db.prepare(`
    SELECT legal_status, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY legal_status
  `).all();

  const byVerification = db.prepare(`
    SELECT verification_status, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY verification_status
  `).all();

  const byJurisdiction = db.prepare(`
    SELECT jurisdiction, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY jurisdiction
  `).all();

  const byState = db.prepare(`
    SELECT state, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY state
    ORDER BY count DESC
  `).all();

  const bySubject = db.prepare(`
    SELECT subject_category, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY subject_category
    ORDER BY count DESC
  `).all();

  const byType = db.prepare(`
    SELECT document_type, COUNT(*) as count 
    FROM legal_documents 
    GROUP BY document_type
    ORDER BY count DESC
  `).all();

  const verifiedCount = db.prepare(`
    SELECT COUNT(*) as count FROM legal_documents WHERE verification_status = 'verified'
  `).get().count;

  const verifiedPercentage = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  return res.json({
    metrics: {
      total_documents: total,
      verified_documents: verifiedCount,
      unverified_documents: total - verifiedCount,
      verification_percentage: verifiedPercentage,
      last_catalog_audit: '2026-01-15',
    },
    coverage_breakdown: {
      by_status: byStatus,
      by_verification: byVerification,
      by_jurisdiction: byJurisdiction,
      by_state: byState,
      by_subject: bySubject,
      by_type: byType,
    },
    inventory_disclaimer: {
      coverage_status: 'Selective Verified Enactments & Central Codes',
      statement: 'This platform indexes primary central codes, key legacy enactments, and select state rules. Coverage is verified against official Gazettes (egazette.gov.in and indiacode.nic.in). Documents marked unverified or draft are undergoing editorial review.',
    },
  });
});

module.exports = router;
