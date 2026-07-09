-- Migración: agregar columnas de dimensiones a publicaciones
-- Ejecutar UNA SOLA VEZ en phpMyAdmin de Hostinger (pestaña SQL)
-- Las columnas son NULL por defecto, así que las publicaciones existentes quedan intactas.

ALTER TABLE publicaciones
  ADD COLUMN ancho INT DEFAULT NULL AFTER tipo_archivo,
  ADD COLUMN alto  INT DEFAULT NULL AFTER ancho;
