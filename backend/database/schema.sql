-- LiftUp - Esquema de base de datos
-- Ejecutar en la base de datos MySQL de Hostinger (phpMyAdmin o CLI)

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  foto_perfil VARCHAR(500) DEFAULT NULL,
  nivel_experiencia ENUM('sin_experiencia', 'principiante', 'intermedio', 'avanzado') NOT NULL DEFAULT 'sin_experiencia',
  biografia TEXT DEFAULT NULL,
  ciudad VARCHAR(100) DEFAULT NULL,
  privacidad ENUM('publico', 'privado') NOT NULL DEFAULT 'publico',
  estado ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Respaldo de tokens activos: permite invalidar sesiones reales al cerrar sesión
-- (un JWT firmado por sí solo no se puede revocar antes de su expiración).
CREATE TABLE IF NOT EXISTS sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(512) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP NOT NULL,
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS publicaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  descripcion TEXT DEFAULT NULL,
  archivo_url VARCHAR(500) NOT NULL,
  tipo_archivo ENUM('imagen', 'video') NOT NULL DEFAULT 'imagen',
  -- Campos opcionales de registro de entrenamiento (pantalla "Publicar sesión")
  ejercicio VARCHAR(150) DEFAULT NULL,
  peso_kg DECIMAL(6,2) DEFAULT NULL,
  series INT DEFAULT NULL,
  repeticiones INT DEFAULT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_publicaciones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUS-004: reacciones a publicaciones (una reacción por usuario por publicación)
CREATE TABLE IF NOT EXISTS reacciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('like') NOT NULL DEFAULT 'like',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reaccion_usuario_publicacion (publicacion_id, usuario_id),
  CONSTRAINT fk_reacciones_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_reacciones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUS-004: comentarios en publicaciones
CREATE TABLE IF NOT EXISTS comentarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  publicacion_id INT NOT NULL,
  usuario_id INT NOT NULL,
  texto TEXT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentarios_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Records personales (PRs) por ejercicio. Tabla lista para próximos releases;
-- el Release 1 no incluye pantalla para registrarlos automáticamente.
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  ejercicio VARCHAR(150) NOT NULL,
  peso DECIMAL(6,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_records_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Logros/insignias. Tabla lista para próximos releases.
CREATE TABLE IF NOT EXISTS logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  fecha_obtenido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logros_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUS-004: relación de seguimiento, usada para priorizar el feed.
-- estado queda en 'aceptado' automáticamente en Release 1 (perfiles privados
-- con aprobación manual de solicitudes queda para un release futuro).
CREATE TABLE IF NOT EXISTS seguimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seguidor_id INT NOT NULL,
  seguido_id INT NOT NULL,
  estado ENUM('pendiente', 'aceptado') NOT NULL DEFAULT 'aceptado',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seguimiento (seguidor_id, seguido_id),
  CONSTRAINT fk_seguimientos_seguidor FOREIGN KEY (seguidor_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_seguimientos_seguido FOREIGN KEY (seguido_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comunidades de gimnasio/grupo. Tabla lista para próximos releases.
CREATE TABLE IF NOT EXISTS comunidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(100) DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS miembros_comunidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comunidad_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_miembro_comunidad (comunidad_id, usuario_id),
  CONSTRAINT fk_miembros_comunidad FOREIGN KEY (comunidad_id)
    REFERENCES comunidades(id) ON DELETE CASCADE,
  CONSTRAINT fk_miembros_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Solicitudes de creación de comunidad. Tabla lista para próximos releases.
CREATE TABLE IF NOT EXISTS solicitudes_comunidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  tipo VARCHAR(100) DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitudes_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reportes de contenido/usuarios. Tabla lista para próximos releases.
CREATE TABLE IF NOT EXISTS reportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  publicacion_id INT DEFAULT NULL,
  tipo VARCHAR(100) NOT NULL,
  motivo TEXT DEFAULT NULL,
  estado ENUM('pendiente', 'revisado', 'descartado') NOT NULL DEFAULT 'pendiente',
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reportes_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_reportes_publicacion FOREIGN KEY (publicacion_id)
    REFERENCES publicaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_publicaciones_usuario ON publicaciones (usuario_id);
CREATE INDEX idx_publicaciones_fecha ON publicaciones (fecha DESC);
CREATE INDEX idx_sesiones_token ON sesiones (token);
CREATE INDEX idx_comentarios_publicacion ON comentarios (publicacion_id);
