require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Carpeta de archivos subidos (fotos de perfil y publicaciones)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Timeout de 2 minutos por petición — evita que el servidor se quede colgado
// indefinidamente si la DB o el procesamiento de archivos tarda demasiado.
app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'El servidor tardó demasiado. Intenta de nuevo.' });
    }
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'LiftUp API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

// Manejo centralizado de errores (incluye errores de multer)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo es demasiado grande. Máximo 100MB.' });
  }
  if (err.message && err.message.startsWith('FORMATO_INVALIDO')) {
    return res.status(400).json({ error: 'Formato no permitido. Solo JPG, PNG, MP4 o MOV.' });
  }
  console.error('[LiftUp Error]', err.message || err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LiftUp API corriendo en http://localhost:${PORT}`);
});
