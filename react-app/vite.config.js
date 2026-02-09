import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server:{
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api" : {
        target: "http://192.168.1.217",
        changeOrigin: true,
      }
    }
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias:{
      "@": path.resolve(__dirname, "./src")
    }
  }
})
