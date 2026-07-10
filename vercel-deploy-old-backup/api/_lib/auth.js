// Passcode auth helpers.
// We use a simple SHA-256 hash (no salt) for the passcode — this is NOT secure
// for multi-user, but for single-user "personal library" it's enough to prevent
// random people from writing to your API. The passcode is set on first visit
// and stored in localStorage on each device.

const crypto = require('crypto');
const { query } = require('./db');

function hashPasscode(passcode) {
  return crypto.createHash('sha256').update(passcode + (process.env.AUTH_SALT || 'pradip-homoe-v2')).digest('hex');
}

function generateUserId() {
  return 'u_' + crypto.randomBytes(8).toString('hex');
}

function generateToken(userId) {
  // Simple token: base64(userId + ':' + signature)
  const sig = crypto.createHash('sha256').update(userId + (process.env.AUTH_SALT || 'pradip-homoe-v2')).digest('hex').slice(0, 16);
  return Buffer.from(`${userId}:${sig}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, sig] = decoded.split(':');
    if (!userId || !sig) return null;
    const expected = crypto.createHash('sha256').update(userId + (process.env.AUTH_SALT || 'pradip-homoe-v2')).digest('hex').slice(0, 16);
    if (sig !== expected) return null;
    return userId;
  } catch (e) {
    return null;
  }
}

async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  // Verify user exists in DB
  const res = await query('SELECT id, name FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

function sendJSON(res, status, data) {
  res.status(status).json(data);
}

function sendError(res, status, message) {
  res.status(status).json({ error: message });
}

module.exports = {
  hashPasscode,
  generateUserId,
  generateToken,
  verifyToken,
  getUserFromRequest,
  sendJSON,
  sendError,
};
