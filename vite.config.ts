
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Casting process to any to avoid "Property 'cwd' does not exist on type 'Process'" error in environments with incomplete Node types
  const nodeProcess = process as any;
  const env = loadEnv(mode, nodeProcess.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || nodeProcess.env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  }
})
