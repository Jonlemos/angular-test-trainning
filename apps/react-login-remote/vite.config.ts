/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  base: 'http://localhost:4201/',
  plugins: [
    react(),
    federation({
      name: 'reactLogin',
      filename: 'remoteEntry.js',
      
      exposes: {
        './Login': './src/components/Login.tsx',
      },
      
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.2.5',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.2.5',
        },
      },
    }),
  ],
  
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        entryFileNames: 'remoteEntry.js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  
  server: {
    port: 4201,
    cors: true,
  },
  
  preview: {
    port: 4201,
  },
});