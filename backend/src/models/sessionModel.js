const pool = require('../config/db');

async function create({ usuarioId, token, expiresAt }) {
  await pool.query(
    'INSERT INTO sesiones (usuario_id, token, fecha_expiracion) VALUES (?, ?, ?)',
    [usuarioId, token, expiresAt]
  );
}

async function exists(token) {
  const [rows] = await pool.query(
    'SELECT id FROM sesiones WHERE token = ? AND fecha_expiracion > NOW()',
    [token]
  );
  return rows.length > 0;
}

async function remove(token) {
  await pool.query('DELETE FROM sesiones WHERE token = ?', [token]);
}

async function removeExpired() {
  await pool.query('DELETE FROM sesiones WHERE fecha_expiracion <= NOW()');
}

module.exports = { create, exists, remove, removeExpired };
