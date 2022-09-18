import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'
import socket from './src/server/socket'

const port = 3000
const socketPort = port + 1

export default defineConfig({
    // plugins: [mkcert()],
    root: "src/client/",
    base: '',
    
    server: {
        port: port,
        https: false,
        proxy: {
            '/socket.io': {
                target: `ws://localhost:${socketPort}`,
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

socket(socketPort)