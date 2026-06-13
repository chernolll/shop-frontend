import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        allowedHosts: [
          'upgrading-epson-techniques-pam.trycloudflare.com',
        ],
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:3301/api/v1',
            ws: true,
          },
        },
      },
    },
  };
});
