const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

function createBackup(customBackupDir = null) {
  const backupDir = customBackupDir || config.BACKUP_DIR;
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(config.DB_PATH)) {
    throw new Error(`Primary database does not exist at ${config.DB_PATH}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `labour_laws_backup_${timestamp}.db`;
  const backupFilePath = path.join(backupDir, backupFilename);

  // Copy primary database file to backup location
  fs.copyFileSync(config.DB_PATH, backupFilePath);

  // Validate integrity of the backup file
  const testDb = new DatabaseSync(backupFilePath);
  const integrity = testDb.prepare('PRAGMA integrity_check').all();
  testDb.close();

  const isOk = integrity.length > 0 && integrity[0].integrity_check === 'ok';
  if (!isOk) {
    throw new Error('Integrity check failed on backup snapshot');
  }

  const stats = fs.statSync(backupFilePath);
  return {
    success: true,
    filename: backupFilename,
    path: backupFilePath,
    sizeBytes: stats.size,
    timestamp: new Date().toISOString(),
    integrity: 'ok',
  };
}

if (require.main === module) {
  try {
    const result = createBackup();
    console.log('Database backup created successfully:', result);
  } catch (err) {
    console.error('Backup error:', err.message);
    process.exit(1);
  }
}

module.exports = { createBackup };
