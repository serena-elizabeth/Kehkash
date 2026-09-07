import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@tiptap')) return 'editor'
          if (id.includes('three')) return 'three'
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-icons')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})
