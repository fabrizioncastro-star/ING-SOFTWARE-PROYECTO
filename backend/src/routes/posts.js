const express = require('express');
const { createPost, updatePost, deletePost, getFeed } = require('../controllers/postController');
const {
  toggleReaction,
  listComments,
  createComment,
  deleteComment,
} = require('../controllers/interactionController');
const { authRequired } = require('../middleware/auth');
const { uploadMedia } = require('../middleware/upload');

const router = express.Router();

router.get('/feed', authRequired, getFeed);
router.post('/', authRequired, uploadMedia.single('archivo'), createPost);
router.put('/:id', authRequired, uploadMedia.single('archivo'), updatePost);
router.delete('/:id', authRequired, deletePost);

// CUS-004: reacciones y comentarios
router.post('/:id/reactions', authRequired, toggleReaction);
router.get('/:id/comments', authRequired, listComments);
router.post('/:id/comments', authRequired, createComment);
router.delete('/:id/comments/:commentId', authRequired, deleteComment);

module.exports = router;
