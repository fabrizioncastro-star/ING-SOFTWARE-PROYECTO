const pool = require('../config/db');

async function follow(seguidorId, seguidoId) {
  await pool.query(
    `INSERT INTO seguimientos (seguidor_id, seguido_id, estado) VALUES (?, ?, 'aceptado')
     ON DUPLICATE KEY UPDATE estado = 'aceptado'`,
    [seguidorId, seguidoId]
  );
}

async function unfollow(seguidorId, seguidoId) {
  await pool.query('DELETE FROM seguimientos WHERE seguidor_id = ? AND seguido_id = ?', [
    seguidorId,
    seguidoId,
  ]);
}

async function counts(usuarioId) {
  const [[{ seguidores }]] = await pool.query(
    "SELECT COUNT(*) AS seguidores FROM seguimientos WHERE seguido_id = ? AND estado = 'aceptado'",
    [usuarioId]
  );
  const [[{ seguidos }]] = await pool.query(
    "SELECT COUNT(*) AS seguidos FROM seguimientos WHERE seguidor_id = ? AND estado = 'aceptado'",
    [usuarioId]
  );
  return { seguidores, seguidos };
}

module.exports = { follow, unfollow, counts };
