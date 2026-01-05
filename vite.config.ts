import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
    preview: {
      port: 25578,
      host: '0.0.0.0'
    },
      plugins: [react()],
      define: {
        'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY),
        'process.env.API_KEY': JSON.stringify(env.DEEPSEEK_API_KEY), // Backward compatibility
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // Keep for fallback
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
