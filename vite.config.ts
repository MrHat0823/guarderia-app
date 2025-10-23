import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import removeConsole from 'vite-plugin-remove-console'; // 👈 nuevo plugin importado

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    removeConsole(), // 👈 plugin agregado aquí
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

