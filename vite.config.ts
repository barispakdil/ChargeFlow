import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/ChargeFlow/',
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'ChargeFlow',
        short_name: 'ChargeFlow',
        description: 'EV Charging Logger',

        theme_color: '#07111f',
        background_color: '#07111f',

        display: 'standalone',
        start_url: '/ChargeFlow/',

        icons: [],
      },
    }),
  ],
})