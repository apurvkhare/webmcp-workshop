/** Step tests: <folder>/tests/N.N.test.ts(x), run in jsdom against a document.modelContext double. */
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@shop$/, replacement: resolve(root, 'shop/src/index.ts') },
      { find: /^@shop\/testing$/, replacement: resolve(root, 'shop/src/testing/index.ts') }
    ]
  },
  test: {
    environment: 'jsdom',
    include: ['**/tests/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '.playground-backups/**', 'scripts/authoring/source/**'],
    setupFiles: [resolve(root, 'shop/src/testing/setup.ts')],
    restoreMocks: true
  }
});
