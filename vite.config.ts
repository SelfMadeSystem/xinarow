import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import socket from './src/server/socket'

const port = Math.floor(Math.random() * 1000) + 3000

export default defineConfig({
    // plugins: [mkcert()],
    root: "src/client/",
    base: '',
    
    server: {
        port: 3000,
        https: false,
        proxy: {
            '/socket.io': {
                target: `ws://localhost:${port}`,
                changeOrigin: true,
                ws: true,
            },
        },
    },
    build: {
        outDir: "../../dist/",

        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': '/src/client',
            '@server': '/src/server',
        },
    },
    optimizeDeps: {
        include: ['socket.io-client'],
    },
    define: {
        'process.env': {},
    },
    appType: 'spa',
})

socket(port)