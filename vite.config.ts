import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWeb = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production' || mode === 'web';
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      !isWeb && electron([
        {
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onstart(options: any) {
            options.reload()
          },
        },
      ]),
      !isWeb && renderer(),
    ].filter(Boolean),
  }
})