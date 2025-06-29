import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    base: './', // Añadir esta línea para rutas relativas
    define: {
      'process.env': env
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[Vite Proxy] Forwarding request: ${req.method} ${req.url} -> ${proxyReq.host}${proxyReq.path}`);
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy] Error:', err);
            });
          },
        },
      },
    },
  };
});
