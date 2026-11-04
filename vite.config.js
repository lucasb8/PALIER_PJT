import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss()],
  envPrefix: ['VITE_', 'PUBLIC_'],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
