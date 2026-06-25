const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const sessionModel = require('../models/sessionModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, correo: user.correo, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function expiresAtFromNow() {
  const days = parseInt((process.env.JWT_EXPIRES_IN || '7d').replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function issueSession(user) {
  const token = signToken(user);
  await sessionModel.create({ usuarioId: user.id, token, expiresAt: expiresAtFromNow() });
  return token;
}

// CUS-001: Registro
async function register(req, res, next) {
  try {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (!correo || !EMAIL_REGEX.test(correo)) {
      return res.status(400).json({ error: 'El formato del correo no es válido' });
    }
    if (!contrasena || contrasena.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
    }

    const existing = await userModel.findByEmail(correo);
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const user = await userModel.create({ nombre: nombre.trim(), correo, contrasenaHash });
    const token = await issueSession(user);

    res.status(201).json({ token, user: userModel.publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// CUS-001: Inicio de sesión
async function login(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const user = await userModel.findByEmail(correo);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const valid = await bcrypt.compare(contrasena, user.contrasena);
    if (!valid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    if (user.estado !== 'activo') {
      return res.status(403).json({ error: 'Esta cuenta no está activa' });
    }

    const token = await issueSession(user);
    res.json({ token, user: userModel.publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// CUS-001: Cierre de sesión (invalida el token en la tabla sesiones)
async function logout(req, res, next) {
  try {
    await sessionModel.remove(req.token);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Devuelve el usuario autenticado actual (para restaurar sesión)
async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: userModel.publicUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me };
