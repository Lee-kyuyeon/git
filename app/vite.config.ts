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
      // 3D 근육 이미지(약 6MB)는 처음부터 다 받지 않고, 본 것만 저장해 오프라인에서도 보이게
      workbox: {
        runtimeCaching: [{
          urlPattern: /\/(exercises3d|muscles3d)\/.*\.webp$/,
          handler: 'CacheFirst',
          options: { cacheName: 'anatomy-3d', expiration: { maxEntries: 300 } },
        }],
      },
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'LiftQuest',
        short_name: 'LiftQuest',
        description: '근육마다 레벨업하는 운동 퀘스트 + 운동·근육 도감',
        lang: 'ko',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3efe6',
        theme_color: '#6c4cff',
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
