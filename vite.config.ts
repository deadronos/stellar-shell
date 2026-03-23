import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const isProductionBuild = mode === 'production';

  return {
    // GitHub Pages serves this repository from /stellar-shell/, so production
    // builds need the repository subpath as the asset base.
    base: isProductionBuild ? '/stellar-shell/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
