// vite.config.js or vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: './vitest.setup.js',
    // Other test configurations...
  },
});