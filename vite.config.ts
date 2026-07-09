import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/flexo-plate-impression-viz/',
  plugins: [react()],
});
