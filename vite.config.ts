import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// BASE is set by the deploy workflow to "/<repo>/" for GitHub Pages
export default defineConfig({
  base: process.env.BASE || '/',
  plugins: [react(), tailwindcss()],
  build: {
    // The frame sequence is served from public/ untouched; keep JS lean.
    target: 'es2020',
  },
});
