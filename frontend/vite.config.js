import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-syntax-highlighter') || id.includes('prismjs') || id.includes('refractor')) {
              return 'vendor-syntax-highlighter';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-markdown') || id.includes('rehype-sanitize') || id.includes('remark-') || id.includes('unified') || id.includes('unist-') || id.includes('hast-') || id.includes('micromark') || id.includes('mdast-')) {
              return 'vendor-markdown';
            }
          }
        }
      }
    }
  }
})
