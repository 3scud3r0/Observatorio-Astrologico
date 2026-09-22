import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '_shell',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: false
  }
});
