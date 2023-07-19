import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from'vite-plugin-mkcert';



export default defineConfig({
  plugins: [solidPlugin(), VitePWA(), mkcert()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
