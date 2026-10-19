const express = require('express');
const crypto = require('node:crypto');
const { getDb } = require('../db/database');
const { hashPassword, verifyPassword, generateToken, requireAuth, requireRole } = require('../middleware/auth');
const { sanitizeString } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  const email = sanitizeString(req.body.email).toLowerCase();
  const password = req.body.password;
  const fullName = sanitizeString(req.body.full_name);
  const tier = req.body.subscription_tier === 'pro' ? 'pro' : req.body.subscription_tier === 'enterprise' ? 'enterprise' : 'free';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'ValidationError', message: 'A valid email address is required' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'ValidationError', message: 'Password must be at least 8 characters long' });
  }

  if (!fullName) {
    return res.status(400).json({ error: 'ValidationError', message: 'Full name is required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'ConflictError', message: 'An account with this email already exists' });
  }

  const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, full_name, role, subscription_tier, subscription_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'subscriber', ?, 'active', ?, ?)
  `).run(userId, email, hash, salt, fullName, tier, now, now);

  const newUser = {
    id: userId,
    email,
    full_name: fullName,
    role: 'subscriber',
    subscription_tier: tier,
    subscription_status: 'active',
  };

  const token = generateToken(newUser);
  return res.status(201).json({
    message: 'User registered successfully',
    user: newUser,
    token,
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const email = sanitizeString(req.body.email).toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ error: 'ValidationError', message: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
  }

  const isValid = verifyPassword(password, user.salt, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
  }

  const userSafe = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    subscription_tier: user.subscription_tier,
    subscription_status: user.subscription_status,
  };

  const token = generateToken(userSafe);
  return res.json({
    message: 'Logged in successfully',
    user: userSafe,
    token,
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, full_name, role, subscription_tier, subscription_status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'NotFound', message: 'User not found' });
  }
  return res.json({ user });
});

// PATCH /api/auth/subscription
router.patch('/subscription', requireAuth, (req, res) => {
  const { tier, status } = req.body;
  const validTiers = ['free', 'pro', 'enterprise'];
  const validStatuses = ['active', 'trialing', 'past_due', 'cancelled'];

  const updatedTier = validTiers.includes(tier) ? tier : req.user.subscription_tier;
  const updatedStatus = validStatuses.includes(status) ? status : req.user.subscription_status;

  const db = getDb();
  db.prepare(`
    UPDATE users SET subscription_tier = ?, subscription_status = ?, updated_at = ? WHERE id = ?
  `).run(updatedTier, updatedStatus, new Date().toISOString(), req.user.id);

  const updatedUser = db.prepare('SELECT id, email, full_name, role, subscription_tier, subscription_status FROM users WHERE id = ?').get(req.user.id);
  const token = generateToken(updatedUser);

  return res.json({
    message: 'Subscription updated successfully',
    user: updatedUser,
    token,
  });
});

// GET /api/auth/users (admin only)
router.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, email, full_name, role, subscription_tier, subscription_status, created_at FROM users ORDER BY created_at DESC').all();
  return res.json({ users });
});

module.exports = router;
