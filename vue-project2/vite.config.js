import { fileURLToPath, URL } from 'url'
// fileURLToPath, URL: 用于在 ES 模块中获取当前文件的路径
import { defineConfig } from 'vite'
// defineConfig: Vite 提供的类型安全配置函数
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 维特  https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {//配置路径别名
      '@': resolve(__dirname, 'src')//'@’表示src目录
    },
  },
  server: {
    port: 2000,  // 使用当前运行的端口 2000
    host: true,
    proxy: {
      '/api': {
        target: 'http://192.168.1.108:2000', // 修改为本地端口或使用 Mock 服务
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true // 添加此选项以正确处理跨域
      }
    }
  }
})