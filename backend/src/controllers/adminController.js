const userModel = require('../models/userModel');
const postModel = require('../models/postModel');

// Panel básico de administrador: métricas generales y listado de usuarios
async function getStats(req, res, next) {
  try {
    const [totalUsuarios, totalPublicaciones] = await Promise.all([
      userModel.count(),
      postModel.count(),
    ]);
    res.json({ totalUsuarios, totalPublicaciones });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const usuarios = await userModel.listAll();
    res.json({ usuarios });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats, listUsers };
