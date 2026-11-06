# Posada Evento

Registro por QR + sorteo para una posada de empresa. Astro (estático) + Firebase (Hosting, Firestore y Auth, plan gratis).

- `/` formulario para el empleado → recibe **número de sorteo** y **código de verificación**.
- `/qr/` pantalla para proyectar el QR.
- `/admin/` panel: registros en vivo, búsqueda, filtro de transporte, CSV, eliminar.
- `/admin/sorteo/` captura el número ganador y muestra nombre + código.

Sitio: https://evento-posada.web.app

## Desarrollo (modo demo, sin Firebase)
```bash
npm install
npm run dev     # http://localhost:4321/
npm test
```
`npm run dev` no usa `.env.production`, así que corre en **modo demo** (datos en `localStorage`, admin con contraseña `demo`). Pool de prueba: `src/data/numeros-prueba.json` (1–500). `npm run build` sí usa `.env.production` (Firebase real).

## Poner en producción (Firebase Hosting)
1. **Firestore**: consola → Build → Firestore Database → Create database (modo producción).
2. **Authentication** → Email/contraseña → Enable. Crea tu usuario admin y copia su UID.
3. En Firestore crea la colección `admins` con un documento cuyo ID sea ese UID (cualquier campo).
4. **Despliega** (publica el sitio y las reglas):
   ```bash
   npm install
   npx firebase-tools login
   npm run deploy
   ```
5. **Carga los números**: con una cuenta de servicio (Project settings → Service accounts → Generate key; guárdala fuera del repo):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json npm run seed -- data-real/numeros.json
   ```
   El archivo es un arreglo de enteros. Sin argumento carga los de prueba (1–500).
6. Abre https://evento-posada.web.app/qr/ y proyéctalo.

## Notas de seguridad
- La config web de Firebase es pública; la protección está en `firestore.rules`: el público solo **crea** su registro y no puede leer la lista (hay teléfonos).
- Un empleado que ya se registró no puede recuperar su número desde otro dispositivo (privacidad); el admin lo consulta en el panel.
- El código de verificación lo genera la app al registrar. Sin padrón de empleados, cualquiera con el QR puede registrarse con un número inventado.
- Nunca subas `serviceAccount*.json` ni los números reales (`data-real/`); ya están en `.gitignore`.
- Elimina datos (registros, usuarios de Auth, proyecto) al terminar el evento.
