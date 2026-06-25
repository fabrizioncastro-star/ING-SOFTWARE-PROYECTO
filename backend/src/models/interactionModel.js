const pool = require('../config/db');

// CUS-004: reacciones (toggle tipo "like") y comentarios

async function toggleReaction(publicacionId, usuarioId) {
  const [existing] = await pool.query(
    'SELECT id FROM reacciones WHERE publicacion_id = ? AND usuario_id = ?',
    [publicacionId, usuarioId]
  );

  if (existing.length > 0) {
    await pool.query('DELETE FROM reacciones WHERE id = ?', [existing[0].id]);
    return { reaccionando: false };
  }

  await pool.query(
    'INSERT INTO reacciones (publicacion_id, usuario_id, tipo) VALUES (?, ?, ?)',
    [publicacionId, usuarioId, 'like']
  );
  return { reaccionando: true };
}

async function listComments(publicacionId) {
  const [rows] = await pool.query(
    `SELECT c.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
     FROM comentarios c
     JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.publicacion_id = ?
     ORDER BY c.fecha ASC`,
    [publicacionId]
  );
  return rows;
}

async function createComment(publicacionId, usuarioId, texto) {
  const [result] = await pool.query(
    'INSERT INTO comentarios (publicacion_id, usuario_id, texto) VALUES (?, ?, ?)',
    [publicacionId, usuarioId, texto]
  );
  const [rows] = await pool.query(
    `SELECT c.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
     FROM comentarios c JOIN usuarios u ON u.id = c.usuario_id WHERE c.id = ?`,
    [result.insertId]
  );
  return rows[0];
}

async function findCommentById(id) {
  const [rows] = await pool.query('SELECT * FROM comentarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function deleteComment(id) {
  await pool.query('DELETE FROM comentarios WHERE id = ?', [id]);
}

module.exports = { toggleReaction, listComments, createComment, findCommentById, deleteComment };
