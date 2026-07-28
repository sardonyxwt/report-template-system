import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { z } from 'zod';

const workspaceRoot = resolve(import.meta.dirname, '../..');

const PortSchema = z.coerce.number().int().min(1).max(65_535);
const ViteEnvironmentSchema = z.object({
  VITE_CLIENT_PORT: PortSchema.default(4201),
  VITE_CLIENT_PREVIEW_PORT: PortSchema.default(4301),
});

export default defineConfig(({ mode }) => {
  const environment = ViteEnvironmentSchema.parse(
    loadEnv(mode, workspaceRoot, 'VITE_'),
  );

  return {
    root: import.meta.dirname,
    envDir: workspaceRoot,
    cacheDir: '../../node_modules/.vite/apps/client',
    plugins: [react(), nxViteTsPaths(), tailwindcss()],
    build: {
      outDir: '../../dist/apps/client',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    server: {
      host: 'localhost',
      port: environment.VITE_CLIENT_PORT,
    },
    preview: {
      host: 'localhost',
      port: environment.VITE_CLIENT_PREVIEW_PORT,
    },
  };
});
