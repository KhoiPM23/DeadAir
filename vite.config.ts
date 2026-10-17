import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 7003,
    strictPort: true,
    open: false
  },
  preview: {
    port: 7003,
    strictPort: true
  }
});
