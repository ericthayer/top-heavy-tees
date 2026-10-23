import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // React and the router change far less often than app code; a separate
    // chunk keeps them cached across deploys.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ }],
        },
      },
    },
    // React + react-dom + router minify to ~260 kB (~82 kB gzip); flag anything bigger.
    chunkSizeWarningLimit: 300,
  },
  test: {
    environment: 'node',
  },
});
