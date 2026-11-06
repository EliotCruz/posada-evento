import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// Publicado en Firebase Hosting (raíz del dominio). Cambia `site` si usas otro proyecto.
export default defineConfig({
  site: 'https://evento-posada.web.app',
  base: '/',
  output: 'static',
  integrations: [preact()],
  vite: { plugins: [tailwindcss()] },
});
