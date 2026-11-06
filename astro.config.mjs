import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

// Ajusta `site` y `base` si cambia el usuario o el nombre del repositorio.
export default defineConfig({
  site: 'https://eliotcruz.github.io',
  base: '/posada-evento',
  output: 'static',
  integrations: [preact()],
  vite: { plugins: [tailwindcss()] },
});
