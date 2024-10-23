import { resolve } from 'node:path'
import react from '@vitejs/plugin-react-swc'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import pages from 'vite-plugin-pages'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 9200,
    proxy: {
      '^/(api|login|register|view|info)': 'http://localhost:9100'
    }
  },
  plugins: [
    react(),
    UnoCSS(),
    pages({
      extensions: ['tsx'],
      exclude: ['**/components/**/*.*', '**/assets/**/*.*', '**/blocks/**/*.*', '**/hooks/**/*.*', '**/_*.*'],
      routeStyle: 'next',
      importMode: 'async',
      dirs: 'src/pages',
      resolver: 'react'
    })
  ],
  build: {
    outDir: resolve(__dirname, '../server/html'),
  }
})
