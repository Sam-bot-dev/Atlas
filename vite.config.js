import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  server: {
    proxy: {
      '/api': {
        target: `http${process.env.BACKEND_URL ? 's' : ''}://${process.env.BACKEND_URL || 'localhost:' + (process.env.PORT || 5000)}`,
        changeOrigin: true,
      },
    },
  },
});
