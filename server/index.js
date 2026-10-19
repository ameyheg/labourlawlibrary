const express = require('express');
const cors = require('cors');
const path = require('node:path');
const config = require('./config');
const { initDb, closeDb } = require('./db/database');
const { authenticateUser } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Initialize database
initDb();

// Security and utility middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Authentication middleware (extracts token and user if present)
app.use(authenticateUser);

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// SPA fallback for HTML5 history API navigation
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'NotFound', message: `API endpoint ${req.path} not found` });
  }
  return res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
  });
});

let server = null;
if (require.main === module) {
  server = app.listen(config.PORT, () => {
    console.log(`India Labour Law Library server running at http://localhost:${config.PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });

  const handleShutdown = () => {
    console.log('\nGracefully shutting down India Labour Law Library...');
    if (server) {
      server.close(() => {
        closeDb();
        console.log('Server and database connections closed cleanly.');
        process.exit(0);
      });
    } else {
      closeDb();
      process.exit(0);
    }
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

module.exports = app;
