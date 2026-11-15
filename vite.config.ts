/**
 * The shop's dev server: the React UI from shop/, the API on /api, and the workshop's guide on /__workshop.
 * Which WebMCP code it loads comes from APP_DIR: playground (default), app, or any exercise folder.
 * `npm start` sets APP_DIR and PORT for you.
 */
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { shopApi } from './shop/src/server/api.ts';
import { workshopGuide } from './shop/src/server/guide.ts';

const root = import.meta.dirname;
const appDir = resolve(root, process.env.APP_DIR ?? 'playground');

export default defineConfig({
  root: resolve(root, 'shop'),
  plugins: [react(), shopApi(), workshopGuide(root, appDir)],
  resolve: {
    alias: [
      { find: /^@shop$/, replacement: resolve(root, 'shop/src/index.ts') },
      { find: /^@app\//, replacement: `${appDir}/` }
    ]
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
    fs: { allow: [root] }
  },
  clearScreen: false,
  logLevel: 'info'
});
