import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()

  ],
  // Prevent Vite from watching unrelated folders (e.g., backend or data)
  // which can cause the dev server to reload the page when those files change.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      ignored: ['**/backend/**', '**/backend/data/**', '**/data/**']
    }
  }
})
