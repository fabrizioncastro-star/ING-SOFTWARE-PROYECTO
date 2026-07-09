const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
// video/quicktime = .mov grabado por iPhone
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/mov'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || guessExt(file.mimetype);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function guessExt(mimetype) {
  if (mimetype === 'image/jpeg') return '.jpg';
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'video/mp4') return '.mp4';
  if (mimetype === 'video/quicktime' || mimetype === 'video/mov') return '.mov';
  return '';
}

// Solo imágenes JPG/PNG (foto de perfil - CU-002)
const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('FORMATO_INVALIDO: solo JPG o PNG'));
  },
});

// Imágenes o video (publicaciones - CU-003)
const uploadMedia = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if ([...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) return cb(null, true);
    cb(new Error('FORMATO_INVALIDO: solo JPG, PNG, MP4 o MOV'));
  },
});

module.exports = { uploadImage, uploadMedia, IMAGE_TYPES, VIDEO_TYPES };
