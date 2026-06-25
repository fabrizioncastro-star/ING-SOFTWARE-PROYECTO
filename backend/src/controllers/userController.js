const userModel = require('../models/userModel');
const postModel = require('../models/postModel');
const followModel = require('../models/followModel');

const NIVELES = ['sin_experiencia', 'principiante', 'intermedio', 'avanzado'];

// CUS-002: Editar perfil (nombre, nivel de experiencia, biografía, ciudad y foto opcional)
async function updateProfile(req, res, next) {
  try {
    const { nombre, nivel_experiencia, biografia, ciudad } = req.body;

    if (nombre !== undefined && !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (nivel_experiencia !== undefined && !NIVELES.includes(nivel_experiencia)) {
      return res.status(400).json({ error: 'Nivel de experiencia inválido' });
    }

    const fields = {};
    if (nombre !== undefined) fields.nombre = String(nombre).trim();
    if (nivel_experiencia !== undefined) fields.nivel_experiencia = nivel_experiencia;
    if (biografia !== undefined) fields.biografia = biografia;
    if (ciudad !== undefined) fields.ciudad = ciudad;
    if (req.file) fields.foto_perfil = `/uploads/${req.file.filename}`;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No hay cambios para guardar' });
    }

    const user = await userModel.update(req.user.id, fields);
    res.json({ user: userModel.publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// Perfil propio o de cualquier usuario, con publicaciones y conteos
async function getProfile(req, res, next) {
  try {
    const userId = req.params.id === 'me' ? req.user.id : req.params.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [posts, followCounts] = await Promise.all([
      postModel.findByUser(userId, req.user.id),
      followModel.counts(userId),
    ]);

    res.json({
      user: userModel.publicUser(user),
      publicaciones: posts,
      total_publicaciones: posts.length,
      ...followCounts,
    });
  } catch (err) {
    next(err);
  }
}

// Seguir / dejar de seguir (soporte para priorización del feed)
async function follow(req, res, next) {
  try {
    const seguidoId = Number(req.params.id);
    if (seguidoId === req.user.id) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }
    await followModel.follow(req.user.id, seguidoId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function unfollow(req, res, next) {
  try {
    await followModel.unfollow(req.user.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, getProfile, follow, unfollow };
