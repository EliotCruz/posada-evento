# Posada Evento

Registro por QR + sorteo para una posada de empresa. Astro (estático) en GitHub Pages + Firebase (Firestore/Auth, plan gratis).

- `/` formulario para el empleado → recibe **número de sorteo** y **código de verificación**.
- `/qr/` pantalla para proyectar el QR.
- `/admin/` panel: registros en vivo, búsqueda, filtro de transporte, CSV, eliminar.
- `/admin/sorteo/` captura el número ganador y muestra nombre + código.

## Desarrollo (modo demo, sin Firebase)
```bash
npm install
npm run dev     # http://localhost:4321/posada-evento/
npm test
```
Sin variables de Firebase la app corre en **modo demo** (datos en `localStorage`, admin con contraseña `demo`). Pool de prueba: `src/data/numeros-prueba.json` (1–500).

## Poner en producción
1. **Firebase**: crea un proyecto → habilita *Firestore* (modo producción) y *Authentication → Email/contraseña*.
2. Crea tu usuario admin en Authentication y, en Firestore, un documento `admins/<UID del usuario>` (cualquier campo).
3. Publica las reglas: `firebase deploy --only firestore:rules` (archivo `firestore.rules`) o pégalas en la consola.
4. Carga los números: `GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json npm run seed -- data-real/numeros.json` (arreglo de enteros; no lo subas al repo).
5. En GitHub: *Settings → Secrets and variables → Actions → Variables*: `PUBLIC_FIREBASE_API_KEY`, `PUBLIC_FIREBASE_AUTH_DOMAIN`, `PUBLIC_FIREBASE_PROJECT_ID`, `PUBLIC_FIREBASE_APP_ID` (ver `.env.example`).
6. *Settings → Pages → Source: GitHub Actions*; haz merge a `main`. Sitio: `https://eliotcruz.github.io/posada-evento/`.
7. En Firebase Auth → Authorized domains agrega `eliotcruz.github.io`.

## Notas de seguridad
- La config web de Firebase es pública; la protección está en `firestore.rules`: el público solo **crea** su registro y no puede leer la lista (hay teléfonos).
- Un empleado que ya se registró no puede recuperar su número desde otro dispositivo (privacidad); el admin lo consulta en el panel.
- El código de verificación lo genera la app al registrar. Sin padrón de empleados, cualquiera con el QR puede registrarse con un número inventado: pide el padrón a la empresa si quieres validarlo.
- Elimina datos (registros, Auth, proyecto) al terminar el evento.
