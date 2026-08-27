import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Padrão node (rápido) pros testes de lógica pura; componentes React que
    // precisam de DOM real usam `// @vitest-environment jsdom` no topo do arquivo.
    environment: 'node',
    exclude: ['node_modules/**', '.claude/**', '.next/**'],
    env: loadEnv('', process.cwd(), ''),
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
