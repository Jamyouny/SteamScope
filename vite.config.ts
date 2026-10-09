import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Readable } from 'node:stream';
import { handleApi } from './server/handler';
import { avatarResponse } from './server/avatar';
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'STEAM_'));
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/@reduxjs') ||
              id.includes('node_modules/redux')
            )
              return 'charts';
            if (
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/motion-')
            )
              return 'motion';
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            )
              return 'react';
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-steam-api',
        configureServer(server) {
          server.middlewares.use('/api', async (req, res) => {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const result =
              url.pathname === '/avatar'
                ? await avatarResponse(url, req.method ?? 'GET')
                : await handleApi(url, req.method ?? 'GET');
            res.statusCode = result.status;
            for (const [key, value] of Object.entries(result.headers))
              res.setHeader(key, value);
            Readable.from([
              Buffer.isBuffer(result.body)
                ? result.body
                : JSON.stringify(result.body),
            ]).pipe(res);
          });
        },
      },
    ],
  };
});
