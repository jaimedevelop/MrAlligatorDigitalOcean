import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), nodePolyfills()],
    optimizeDeps: {
      include: ['pouchdb-browser', 'pouchdb-find', 'spark-md5', 'vuvuzela'],
    },
    resolve: {
    },
    define: {
      // Make process.env available in the client
      'process.env': env,
      global: 'globalThis',
    },
    server: {
      fs: {
        allow: ['..'],
        strict: false
      },
    },
    publicDir: 'public',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        external: ['pouchdb-browser', 'pouchdb-find'],
        output: {
          manualChunks: {
            pouchdb: ['pouchdb-browser', 'pouchdb-find']
          }
        }
      }
    }
  };
});