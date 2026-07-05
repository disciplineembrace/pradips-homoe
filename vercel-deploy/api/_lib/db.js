// Shared database connection pool for Vercel serverless functions.
// Uses the `pg` library which is pre-bundled by Vercel's Node runtime.
const { Pool } = require('pg');

// Reuse pool across hot reloads (Vercel sometimes reuses function instances)
let _pool = null;

function getPool() {
  if (_pool) return _pool;
  _pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  _pool.on('error', (err) => {
    console.error('Pool error', err);
  });
  return _pool;
}

async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  const res = await pool.query(text, params);
  const ms = Date.now() - start;
  if (ms > 500) console.log('slow query', ms, 'ms', text.slice(0, 80));
  return res;
}

module.exports = { query, getPool };
