import { defineConfig } from 'vite';
import seoInjectPlugin from './vite-plugin-inject';

export default defineConfig({
  plugins: [seoInjectPlugin()],
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