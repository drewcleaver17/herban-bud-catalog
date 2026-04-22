import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (bud.drewcleaver.com) means base is '/'. If you ever
// serve from drewcleaver17.github.io/herban-bud-catalog/ instead, change
// this to '/herban-bud-catalog/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
