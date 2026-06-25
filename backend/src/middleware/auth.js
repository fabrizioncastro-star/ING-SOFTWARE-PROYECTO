const jwt = require('jsonwebtoken');
const sessionModel = require('../models/sessionModel');

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  try {
    // Verifica que la sesión no haya sido cerrada (logout) ni expirado en BD
    const valid = await sessionModel.exists(token);
    if (!valid) {
      return res.status(401).json({ error: 'Sesión cerrada o expirada' });
    }
    req.user = payload; // { id, correo, rol }
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requiere rol de administrador' });
  }
  next();
}

module.exports = { authRequired, adminRequired };
