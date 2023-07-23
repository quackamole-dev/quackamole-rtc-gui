import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
// import { VitePWA } from 'vite-plugin-pwa'; // causes annoying caching behaviour with default options which isn't desirable at this development stage
import mkcert from'vite-plugin-mkcert';



export default defineConfig({
  optimizeDeps: {
    exclude: ['webrtc-adapter']
  },
  plugins: [solidPlugin(), /* VitePWA(),*/ mkcert()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
