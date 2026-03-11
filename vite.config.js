import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'Vanilla Hooks',
                short_name: 'Vanilla',
                description: 'Web3 Workflow Orchestration directly on your phone.',
                theme_color: '#0a0a0f',
                background_color: '#0a0a0f',
                display: 'standalone',
                icons: [
                    {
                        src: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'https://cdn-icons-png.flaticon.com/512/1126/1126012.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
})
