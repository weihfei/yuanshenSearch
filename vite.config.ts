import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server:{
    proxy:{
      '/api': {
        target: 'https://hk4e-api.mihoyo.com/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, 'event/gacha_info/api/getGachaLog'),
      }
    }
  }
})

