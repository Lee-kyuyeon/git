import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// GitHub Pages 주소가 https://<user>.github.io/git/ 이므로 base는 /git/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/git/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'LiftLog',
        short_name: 'LiftLog',
        description: '내 몸에 맞춰 짜고, 기록할수록 똑똑해지는 운동 일지',
        lang: 'ko',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: { alias: { '@core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
});
