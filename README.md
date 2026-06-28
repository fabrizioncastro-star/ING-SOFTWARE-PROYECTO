# LiftUp 🏋️

Red social fitness para gimnasios. Backend en Hostinger + APK instalable generado con EAS Build.

## Entorno de producción

- **Backend (API):** https://indigo-pigeon-660133.hostingersite.com
- **Frontend (Expo Go):** publicado vía EAS Update en la cuenta `fangos` (rama `preview`)

## Estructura

```
├── backend/    → API REST (Node.js + Express + MySQL), arquitectura MVC
│   ├── src/
│   │   ├── config/        → Conexión a MySQL (pool)
│   │   ├── models/        → Acceso a datos (usuarios, publicaciones, sesiones, reacciones/comentarios, seguimientos)
│   │   ├── controllers/   → Lógica de negocio (auth, perfil, publicaciones, interacciones, admin)
│   │   ├── middleware/    → JWT + validación de sesión en BD, subida de archivos (multer)
│   │   └── routes/        → Definición de endpoints
│   ├── database/schema.sql → Esquema completo de la base de datos
│   └── uploads/           → Archivos subidos (se crea automáticamente)
└── frontend/   → App móvil (React Native + Expo + EAS Build)
    └── src/
        ├── api/           → Cliente HTTP (axios) con JWT
        ├── context/       → Estado de autenticación
        ├── navigation/    → Stack + tabs (React Navigation)
        ├── components/    → Avatar, Logo, LabeledInput, ScreenHeader, PostCard
        └── screens/       → Login, Registro, Feed, Publicar, Comentarios, Perfil, Editar perfil, Admin
```

## Alcance de este release (MVP)

Funcionalidades implementadas de extremo a extremo:

- **CUS-001 Gestionar Cuenta**: registro, login, logout con invalidación real de sesión en BD, distinción usuario/admin por el campo `rol`.
- **CUS-002 Gestionar Perfil**: editar foto (JPG/PNG), nombre, nivel de experiencia, biografía, ciudad.
- **CUS-003 Gestionar Publicaciones**: crear (foto/video JPG/PNG/MP4 + descripción + datos de entrenamiento: ejercicio/peso/series/reps), editar y eliminar publicaciones propias.
- **CUS-004 Explorar Feed e Interacciones**: feed priorizado por usuarios seguidos, reacciones (like), comentarios, eliminar comentario propio.

**Tablas creadas pero sin CRUD/UI todavía** (quedan listas para releases futuros, ya que no forman parte de las funcionalidades del Release 1 que definiste): `records`, `logros`, `comunidades`, `miembros_comunidad`, `solicitudes_comunidad`, `reportes`. La tabla `seguimientos` sí está activa (sigue/deja de seguir, prioriza el feed); el campo `estado` queda fijo en `'aceptado'` — la aprobación manual de seguidores para perfiles privados no está incluida en este release.

## Requisitos previos

- Cuenta de Hostinger con un plan que incluya **Node.js App** y **MySQL** (Premium/Business o Cloud).
- Cuenta de Expo (gratuita) para usar EAS Build: https://expo.dev/signup
- Node.js 18+ instalado localmente.

---

## 1. Base de datos MySQL en Hostinger

1. En **hPanel → Bases de datos → Bases de datos MySQL**, crea una base de datos. Hostinger te dará:
   - **Host** (ej. `srv1234.hstgr.io`)
   - **Nombre de la base de datos** (ej. `u123456789_liftup`)
   - **Usuario** (ej. `u123456789_admin`)
   - **Contraseña** (la que definas al crearla)
2. Anota esos 4 datos — los necesitarás para las variables de entorno del backend.
3. Entra a **phpMyAdmin** (botón junto a tu base de datos) y ejecuta el contenido completo de [`backend/database/schema.sql`](backend/database/schema.sql) en la pestaña **SQL**.
4. En **hPanel → Bases de datos → MySQL remoto**, agrega `%` (o la IP del servidor Node si Hostinger te la indica) para que tu propia app Node pueda conectarse. Si el Node.js App y la base de datos están en el mismo hosting, normalmente ya pueden comunicarse por `localhost` sin este paso — usa el host que te indique el panel.

Para crear tu primer administrador, registra un usuario normal desde la app y luego en phpMyAdmin ejecuta:

```sql
UPDATE usuarios SET rol = 'admin' WHERE correo = 'tu@correo.com';
```

---

## 2. Subir y configurar el backend en Hostinger

1. En **hPanel → Avanzado → Setup Node.js App**, crea una nueva aplicación:
   - **Versión de Node.js**: la más reciente disponible (18 o 20+).
   - **Carpeta de la aplicación**: ej. `liftup-backend` (se crea dentro de tu hosting).
   - **Archivo de inicio (startup file)**: `src/index.js`
2. Sube el contenido completo de la carpeta `backend/` (todo excepto `node_modules/` y `.env`) a esa carpeta. Puedes usar el **Administrador de archivos** de hPanel o FTP/SFTP (datos en hPanel → Archivos → Cuentas FTP).
3. En esa misma pantalla de "Setup Node.js App", en la sección **Variables de entorno**, agrega (sin crear archivo `.env` — Hostinger las inyecta directamente):

   | Variable | Valor |
   |---|---|
   | `DB_HOST` | el host de tu MySQL (paso 1) |
   | `DB_PORT` | `3306` |
   | `DB_USER` | el usuario de tu MySQL |
   | `DB_PASSWORD` | la contraseña de tu MySQL |
   | `DB_NAME` | el nombre de tu base de datos |
   | `JWT_SECRET` | una cadena larga y aleatoria (ej. genera una con `openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `PORT` | el puerto que te asigne Hostinger (normalmente lo define el panel automáticamente) |

4. Click en **NPM Install** (botón dentro del panel de la app Node) para instalar las dependencias del `package.json`.
5. Click en **Reiniciar** / **Start App**.

### URL pública de tu API

Hostinger asigna automáticamente una URL del tipo `https://tu-dominio.com` o una ruta proxy (ej. `https://tu-dominio.com:3000`) — la verás en la misma pantalla de "Setup Node.js App", en el campo **Application URL** o **Dominio**. Si tienes un dominio propio, puedes apuntar un subdominio (ej. `api.tudominio.com`) a esta aplicación desde **hPanel → Dominios**.

### Probar que el backend funciona

Desde el navegador o con `curl`, visita:

```
https://tu-dominio-backend.com/api/health
```

Debe responder:

```json
{ "ok": true, "app": "LiftUp API" }
```

Si da error 502/503, revisa los **logs** del Node.js App en hPanel (botón "Ver logs") — casi siempre es una variable de entorno de MySQL mal copiada o que falta `NPM Install`.

---

## 3. Generar el APK con EAS Build

1. Instala la CLI de EAS y autentícate con tu cuenta de Expo:
   ```bash
   cd frontend
   npm install -g eas-cli
   eas login
   ```
2. Vincula el proyecto a tu cuenta de Expo (genera un `projectId` real en `app.json`):
   ```bash
   eas init
   ```
3. Antes de compilar, **apunta el frontend a la URL pública de tu backend en Hostinger** (no a tu IP local). Edita `frontend/eas.json` y reemplaza `https://tu-dominio-backend.com` por la URL real obtenida en el paso 2 de la sección anterior, en **ambos** perfiles (`preview` y `production`). También actualiza tu `.env` local con esa misma URL si quieres probarlo antes de compilar.
4. Genera el APK (perfil `preview`, instalable directamente sin pasar por Play Store):
   ```bash
   eas build --platform android --profile preview
   ```
5. Cuando termine (10-20 min en la nube de Expo), la terminal te da un **link de descarga** del `.apk`. EAS también muestra un **código QR** que puedes escanear desde el celular Android para descargarlo e instalarlo directamente (debes permitir "Instalar apps de orígenes desconocidos" la primera vez).
6. Para compartirlo con otras personas: comparte ese mismo link (también queda guardado en https://expo.dev → tu proyecto → Builds) o reenvía el código QR.

> El perfil `production` en `eas.json` está configurado igual que `preview` (ambos generan `.apk` en vez de `.aab`) porque no vas a publicar en Google Play. Si más adelante quieres subirlo a la Play Store, cambia `"buildType": "apk"` a `"buildType": "app-bundle"` en el perfil `production`.

---

## Desarrollo local (sin Hostinger ni EAS)

```bash
# Backend
cd backend
npm install
copy .env.example .env   # editar con credenciales locales o de Hostinger
npm run dev

# Frontend (con Expo Go, en la misma red WiFi)
cd frontend
npm install
copy .env.example .env   # EXPO_PUBLIC_API_URL=http://<IP-local-de-tu-PC>:3000
npx expo start
```

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (CUS-001) |
| POST | `/api/auth/login` | Inicio de sesión (CUS-001) |
| POST | `/api/auth/logout` | Cierre de sesión, invalida el token (CUS-001) |
| GET | `/api/auth/me` | Usuario actual (restaurar sesión) |
| PUT | `/api/users/profile` | Editar perfil + foto (CUS-002) |
| GET | `/api/users/:id` | Perfil con publicaciones y conteos de seguidores/seguidos |
| POST/DELETE | `/api/users/:id/follow` | Seguir / dejar de seguir |
| GET | `/api/posts/feed` | Feed priorizado (CUS-004) |
| POST | `/api/posts` | Crear publicación (CUS-003) |
| PUT | `/api/posts/:id` | Editar publicación propia (CUS-003) |
| DELETE | `/api/posts/:id` | Eliminar publicación propia (CUS-003) |
| POST | `/api/posts/:id/reactions` | Reaccionar/quitar reacción (CUS-004) |
| GET/POST | `/api/posts/:id/comments` | Listar / crear comentario (CUS-004) |
| DELETE | `/api/posts/:id/comments/:commentId` | Eliminar comentario propio (CUS-004) |
| GET | `/api/admin/stats` | Métricas (solo admin) |
| GET | `/api/admin/usuarios` | Listado de usuarios (solo admin) |

### Tiempos de respuesta (NFR)

Los timeouts del cliente reflejan los requisitos: 5 s para login/logout/feed, 10 s para registro, publicaciones y guardado de perfil.

## Roles

- **usuario**: rol por defecto al registrarse.
- **admin**: ve la pestaña "Admin" con métricas y listado de usuarios.
