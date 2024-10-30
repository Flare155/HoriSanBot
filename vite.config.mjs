// vite.config.js or vitest.config.js
// import { defineConfig } from 'vitest';
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: './vitest.setup.js',
    globalSetup: './vitest.global-setup.js',
  },
});