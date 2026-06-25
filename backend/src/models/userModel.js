const pool = require('../config/db');

function publicUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    foto_perfil: row.foto_perfil,
    nivel_experiencia: row.nivel_experiencia,
    biografia: row.biografia,
    ciudad: row.ciudad,
    privacidad: row.privacidad,
    fecha_registro: row.fecha_registro,
  };
}

async function findByEmail(correo) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create({ nombre, correo, contrasenaHash }) {
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)',
    [nombre, correo.toLowerCase(), contrasenaHash]
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const columns = Object.keys(fields);
  if (columns.length === 0) return findById(id);

  const setClause = columns.map((col) => `${col} = ?`).join(', ');
  const values = columns.map((col) => fields[col]);
  await pool.query(`UPDATE usuarios SET ${setClause} WHERE id = ?`, [...values, id]);
  return findById(id);
}

async function listAll() {
  const [rows] = await pool.query(
    'SELECT id, nombre, correo, rol, nivel_experiencia, estado, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
  );
  return rows;
}

async function count() {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  return total;
}

module.exports = { publicUser, findByEmail, findById, create, update, listAll, count };
