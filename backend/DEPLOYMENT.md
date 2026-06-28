# Despliegue del Backend - LiftUp

## Servidor: Hostinger (App web de Node.js)

URL de producción: `https://indigo-pigeon-660133.hostingersite.com`

### Pasos realizados

1. Empaquetar el backend en un `.zip` (excluyendo `node_modules/`, `.env` y `uploads/`).
2. Crear la app en hPanel → "App web de Node.js", subiendo ese `.zip`.
3. Configurar:
   - Gestor de paquetes: `npm`
   - Archivo de entrada: `src/index.js`
   - Versión de Node: 22.x
4. Ejecutar **NPM Install** desde el panel.
5. Configurar las variables de entorno (ver `.env.example`) directamente en el panel de Hostinger.

### Base de datos MySQL

- Creada en hPanel → Bases de datos → Bases de datos MySQL.
- Esquema cargado ejecutando `database/schema.sql` en phpMyAdmin.
- **Importante:** usar `127.0.0.1` como `DB_HOST` (no `localhost`), ya que el driver de Node resuelve `localhost` como IPv6 (`::1`) y el usuario de la base de datos solo tiene permisos para conectarse vía IPv4.

### Verificación

```
GET https://indigo-pigeon-660133.hostingersite.com/api/health
```

Debe responder `{ "ok": true, "app": "LiftUp API" }`.
