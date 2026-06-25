const fs = require('fs');
const path = require('path');
const postModel = require('../models/postModel');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function tipoArchivo(mimetype) {
  return mimetype === 'video/mp4' ? 'video' : 'imagen';
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

// CUS-003: Crear publicación (foto o video + descripción + datos de entrenamiento opcionales)
async function createPost(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes adjuntar una foto (JPG/PNG) o un video (MP4)' });
    }

    const { descripcion, ejercicio, peso_kg, series, repeticiones } = req.body;

    const post = await postModel.create({
      usuarioId: req.user.id,
      descripcion: descripcion || null,
      archivoUrl: `/uploads/${req.file.filename}`,
      tipoArchivo: tipoArchivo(req.file.mimetype),
      ejercicio: ejercicio || null,
      pesoKg: parseNumber(peso_kg),
      series: parseNumber(series),
      repeticiones: parseNumber(repeticiones),
    });

    res.status(201).json({ publicacion: post });
  } catch (err) {
    next(err);
  }
}

// CUS-003: Editar publicación propia
async function updatePost(req, res, next) {
  try {
    const existing = await postModel.rawById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    if (existing.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes editar tus propias publicaciones' });
    }

    const { descripcion, ejercicio, peso_kg, series, repeticiones } = req.body;
    const fields = {};
    if (descripcion !== undefined) fields.descripcion = descripcion;
    if (ejercicio !== undefined) fields.ejercicio = ejercicio || null;
    if (peso_kg !== undefined) fields.peso_kg = parseNumber(peso_kg);
    if (series !== undefined) fields.series = parseNumber(series);
    if (repeticiones !== undefined) fields.repeticiones = parseNumber(repeticiones);

    if (req.file) {
      fields.archivo_url = `/uploads/${req.file.filename}`;
      fields.tipo_archivo = tipoArchivo(req.file.mimetype);
      deleteLocalFile(existing.archivo_url);
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No hay cambios para guardar' });
    }

    await postModel.update(req.params.id, fields);
    const updated = await postModel.findById(req.params.id, req.user.id);
    res.json({ publicacion: updated });
  } catch (err) {
    next(err);
  }
}

// CUS-003: Eliminar publicación propia
async function deletePost(req, res, next) {
  try {
    const existing = await postModel.rawById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    if (existing.usuario_id !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propias publicaciones' });
    }

    await postModel.remove(req.params.id);
    deleteLocalFile(existing.archivo_url);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// CUS-004: Feed — prioriza publicaciones de usuarios seguidos,
// pero funciona aunque el usuario no siga a nadie.
async function getFeed(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const posts = await postModel.getFeed({ viewerId: req.user.id, page, limit });
    res.json({ publicaciones: posts, page, limit });
  } catch (err) {
    next(err);
  }
}

function deleteLocalFile(archivoUrl) {
  if (!archivoUrl || !archivoUrl.startsWith('/uploads/')) return;
  const filePath = path.join(uploadsDir, path.basename(archivoUrl));
  fs.unlink(filePath, () => {});
}

module.exports = { createPost, updatePost, deletePost, getFeed };
