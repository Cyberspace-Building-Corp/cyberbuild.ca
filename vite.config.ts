import { defineConfig } from 'vite';
import seoInjectPlugin from './vite-plugin-inject';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [seoInjectPlugin(), cloudflare()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});