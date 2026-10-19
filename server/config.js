const path = require('node:path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'labour_law_library_secure_jwt_dev_key_89234892384923',
  DB_PATH: path.resolve(process.env.DB_PATH || './data/labour_laws.db'),
  BACKUP_DIR: path.resolve(process.env.BACKUP_DIR || './backups'),
};
