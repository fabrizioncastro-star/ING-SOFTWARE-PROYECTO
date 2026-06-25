const pool = require('../config/db');

const SELECT_BASE = `
  SELECT p.*, u.nombre AS autor_nombre, u.foto_perfil AS autor_foto,
         (SELECT COUNT(*) FROM reacciones r WHERE r.publicacion_id = p.id) AS total_reacciones,
         (SELECT COUNT(*) FROM comentarios c WHERE c.publicacion_id = p.id) AS total_comentarios
  FROM publicaciones p
  JOIN usuarios u ON u.id = p.usuario_id
`;

async function create({ usuarioId, descripcion, archivoUrl, tipoArchivo, ejercicio, pesoKg, series, repeticiones }) {
  const [result] = await pool.query(
    `INSERT INTO publicaciones
      (usuario_id, descripcion, archivo_url, tipo_archivo, ejercicio, peso_kg, series, repeticiones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, descripcion || null, archivoUrl, tipoArchivo, ejercicio || null, pesoKg || null, series || null, repeticiones || null]
  );
  return findById(result.insertId, usuarioId);
}

async function findById(id, viewerId = null) {
  const [rows] = await pool.query(`${SELECT_BASE} WHERE p.id = ?`, [id]);
  if (!rows[0]) return null;
  return attachViewerReaction(rows, viewerId)[0];
}

async function findByUser(usuarioId, viewerId = null) {
  const [rows] = await pool.query(
    `${SELECT_BASE} WHERE p.usuario_id = ? ORDER BY p.fecha DESC`,
    [usuarioId]
  );
  return attachViewerReaction(rows, viewerId);
}

async function rawById(id) {
  const [rows] = await pool.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
  return rows[0] || null;
}

async function update(id, fields) {
  const columns = Object.keys(fields);
  if (columns.length === 0) return rawById(id);

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const values = columns.map((col) => fields[col]);
  await pool.query(`UPDATE publicaciones SET ${setClause} WHERE id = ?`, [...values, id]);
  return rawById(id);
}

async function remove(id) {
  await pool.query('DELETE FROM publicaciones WHERE id = ?', [id]);
}

// CUS-004: feed priorizando publicaciones de usuarios seguidos
async function getFeed({ viewerId, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(
    `${SELECT_BASE}
     WHERE 1=1
     ORDER BY EXISTS(
       SELECT 1 FROM seguimientos s
       WHERE s.seguidor_id = ? AND s.seguido_id = p.usuario_id AND s.estado = 'aceptado'
     ) DESC, p.fecha DESC
     LIMIT ? OFFSET ?`,
    [viewerId, limit, offset]
  );
  return attachViewerReaction(rows, viewerId);
}

async function attachViewerReaction(rows, viewerId) {
  if (!viewerId || rows.length === 0) {
    return rows.map((r) => ({ ...r, le_gusta: false }));
  }
  const ids = rows.map((r) => r.id);
  const [liked] = await pool.query(
    `SELECT publicacion_id FROM reacciones WHERE usuario_id = ? AND publicacion_id IN (?)`,
    [viewerId, ids]
  );
  const likedSet = new Set(liked.map((r) => r.publicacion_id));
  return rows.map((r) => ({ ...r, le_gusta: likedSet.has(r.id) }));
}

async function count() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM publicaciones');
  return total;
}

module.exports = { create, findById, findByUser, rawById, update, remove, getFeed, count };
