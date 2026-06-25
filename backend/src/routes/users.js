const express = require('express');
const { updateProfile, getProfile, follow, unfollow } = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const router = express.Router();

router.put('/profile', authRequired, uploadImage.single('foto_perfil'), updateProfile);
router.get('/:id', authRequired, getProfile);
router.post('/:id/follow', authRequired, follow);
router.delete('/:id/follow', authRequired, unfollow);

module.exports = router;
