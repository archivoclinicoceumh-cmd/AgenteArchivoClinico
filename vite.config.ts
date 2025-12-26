
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid 'Property cwd does not exist on type Process' error.
  // process.cwd() is available in the Node.js environment where vite.config.ts executes.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
