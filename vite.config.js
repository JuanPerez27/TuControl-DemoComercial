import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const pagina = (ruta) => resolve(import.meta.dirname, ruta);

/** Inserta el navbar compartido donde una página tenga <!-- navbar -->. */
const navbar = {
  name: 'navbar-compartido',
  transformIndexHtml: (html) => html.replace('<!-- navbar -->', () => readFileSync(pagina('src/parciales/navbar.html'), 'utf8')),
};

export default defineConfig({
  plugins: [tailwindcss(), navbar],
  build: {
    rollupOptions: {
      input: {
        inicio: pagina('index.html'),
        demo: pagina('demo/index.html'),
        socios: pagina('socios-2026/index.html'),
        gracias: pagina('gracias/index.html'),
        privacidad: pagina('privacidad/index.html'),
      },
    },
  },
});
