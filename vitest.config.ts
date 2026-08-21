import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['node_modules/**', '.claude/**', '.next/**'],
    env: loadEnv('', process.cwd(), '')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
