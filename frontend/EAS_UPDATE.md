# Distribución con EAS Update

LiftUp se distribuye sin pasar por Google Play ni App Store, usando **EAS Update** +
**Expo Go**. El código JavaScript se publica en la nube de Expo y cualquiera con
Expo Go puede abrirlo desde un QR, sin que el servidor de desarrollo (`expo start`)
tenga que estar corriendo.

## Publicar una nueva versión

```bash
cd frontend
npx eas-cli login
npm run update
```

Esto sube el bundle actual a la rama `preview`. El QR para compartir queda disponible en:

```
https://expo.dev/accounts/fangos/projects/liftup
```

## Notas

- Solo actualiza código JavaScript. Si se agrega una librería con código nativo no
  incluido en Expo Go, hay que generar un build nuevo (`eas build`).
- La variable `EXPO_PUBLIC_API_URL` se incluye en el bundle al momento de publicar
  (lee el archivo `.env` local) — verificar que apunte al backend de producción
  antes de correr `npm run update`.
