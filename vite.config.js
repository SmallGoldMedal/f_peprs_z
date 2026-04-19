import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 添加 /admin 路径代理
      '^/(auth|exercise|plan|rating|record|injury|exclusion|user|admin)': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})