const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { initDb, closeDb } = require('../db/database');
const { runSeed } = require('../db/seed');
const { hashPassword, verifyPassword, generateToken, requireRole, requireSubscription } = require('../middleware/auth');

test('Permissions & Security Test Suite', async (t) => {
  const db = initDb(':memory:');
  runSeed(db);

  await t.test('1. Password verification accurately matches correct and rejects wrong credentials', () => {
    const { salt, hash } = hashPassword('MySecretPass123!');
    assert.ok(verifyPassword('MySecretPass123!', salt, hash), 'Correct password must verify');
    assert.strictEqual(verifyPassword('WrongPass!', salt, hash), false, 'Incorrect password must be rejected');
    assert.strictEqual(verifyPassword('', salt, hash), false, 'Empty password must be rejected');
  });

  await t.test('2. JWT tokens sign user claims and decode securely', () => {
    const user = {
      id: 'usr_test_1',
      email: 'test@example.com',
      role: 'subscriber',
      subscription_tier: 'pro',
      subscription_status: 'active',
      full_name: 'Test Subscriber',
    };
    const token = generateToken(user);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    assert.strictEqual(decoded.id, user.id);
    assert.strictEqual(decoded.role, 'subscriber');
    assert.strictEqual(decoded.subscription_tier, 'pro');
  });

  await t.test('3. Role authorization middleware restricts subscriber from admin action', () => {
    const middleware = requireRole('admin', 'editor');

    let errorResult = null;
    const reqSubscriber = {
      user: { id: 'usr_sub_1', role: 'subscriber' },
    };
    const resSubscriber = {
      status(code) {
        return {
          json(payload) {
            errorResult = { code, payload };
          },
        };
      },
    };
    let nextCalled = false;
    middleware(reqSubscriber, resSubscriber, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'Subscriber should not pass admin middleware');
    assert.strictEqual(errorResult.code, 403);
    assert.strictEqual(errorResult.payload.error, 'Forbidden');
  });

  await t.test('4. Role authorization middleware permits admin and editor', () => {
    const middleware = requireRole('admin', 'editor');

    let adminNext = false;
    middleware({ user: { id: 'usr_adm', role: 'admin' } }, {}, () => {
      adminNext = true;
    });
    assert.strictEqual(adminNext, true, 'Admin must be permitted');

    let editorNext = false;
    middleware({ user: { id: 'usr_edt', role: 'editor' } }, {}, () => {
      editorNext = true;
    });
    assert.strictEqual(editorNext, true, 'Editor must be permitted');
  });

  await t.test('5. Unauthenticated request without user payload gets 401', () => {
    const middleware = requireRole('admin');
    let errorResult = null;
    const reqNoAuth = { user: null };
    const res = {
      status(code) {
        return {
          json(payload) {
            errorResult = { code, payload };
          },
        };
      },
    };

    middleware(reqNoAuth, res, () => {});
    assert.strictEqual(errorResult.code, 401);
    assert.strictEqual(errorResult.payload.error, 'Unauthorized');
  });

  await t.test('6. Subscription tier requirement enforces tier gating', () => {
    const proGate = requireSubscription('pro', 'enterprise');

    let errorResult = null;
    const res = {
      status(code) {
        return {
          json(payload) {
            errorResult = { code, payload };
          },
        };
      },
    };

    // Free subscriber should be rejected with 403
    let freeNext = false;
    proGate({ user: { id: 'usr_free', role: 'subscriber', subscription_tier: 'free', subscription_status: 'active' } }, res, () => {
      freeNext = true;
    });
    assert.strictEqual(freeNext, false);
    assert.strictEqual(errorResult.code, 403);

    // Pro subscriber should pass
    let proNext = false;
    proGate({ user: { id: 'usr_pro', role: 'subscriber', subscription_tier: 'pro', subscription_status: 'active' } }, res, () => {
      proNext = true;
    });
    assert.strictEqual(proNext, true);

    // Cancelled pro subscriber should get 402 Payment Required
    let cancelledNext = false;
    proGate({ user: { id: 'usr_canc', role: 'subscriber', subscription_tier: 'pro', subscription_status: 'cancelled' } }, res, () => {
      cancelledNext = true;
    });
    assert.strictEqual(cancelledNext, false);
    assert.strictEqual(errorResult.code, 402);
  });

  closeDb();
});
