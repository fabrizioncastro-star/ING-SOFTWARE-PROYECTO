const interactionModel = require('../models/interactionModel');
const postModel = require('../models/postModel');

// CUS-004: reaccionar (toggle "like") a una publicación
async function toggleReaction(req, res, next) {
  try {
    const post = await postModel.rawById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    const result = await interactionModel.toggleReaction(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listComments(req, res, next) {
  try {
    const post = await postModel.rawById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    const comentarios = await interactionModel.listComments(req.params.id);
    res.json({ comentarios });
  } catch (err) {
    next(err);
  }
}

// CUS-004: comentar una publicación
async function createComment(req, res, next) {
  try {
    const { texto } = req.body;
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío' });
    }

    const post = await postModel.rawById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    const comentario = await interactionModel.createComment(req.params.id, req.user.id, texto.trim());
    res.status(201).json({ comentario });
  } catch (err) {
    next(err);
  }
}

// CUS-004: eliminar comentario propio
async function deleteComment(req, res, next) {
  try {
    const comentario = await interactionModel.findCommentById(req.params.commentId);
    if (!comentario) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    if (comentario.usuario_id !== req.user.id && req.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios comentarios' });
    }

    await interactionModel.deleteComment(req.params.commentId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleReaction, listComments, createComment, deleteComment };
