import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: {
      // In development the app calls /crm/... and Vite forwards it to the local SugarCRM,
      // so the browser never makes a cross-origin request.
      proxy: {
        '/crm': {
          target: env.CRM_PROXY_TARGET || 'http://localhost/taskscrm',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/crm/, ''),
        },
      },
    },
  }
})
