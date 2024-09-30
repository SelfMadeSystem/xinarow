import { defineConfig } from "vite";
import socket from "./src/server/socket";

const multiplayerSupport = process.env.VITE_MULTIPLAYER === "true";
const noServer = process.env.VITE_NO_SERVER === "true";

const port = Math.floor(Math.random() * 1000) + 3000;

export default defineConfig({
    root: "src/client/",
    base: "",

    server: {
        port: 3001,
        ...(multiplayerSupport
            ? {
                  proxy: {
                      "/socket.io": {
                          target: `ws://localhost:${port}`,
                          changeOrigin: true,
                          ws: true,
                      },
                  },
              }
            : {}),
    },
    build: {
        outDir: "../../dist/",

        emptyOutDir: true,
    },
    resolve: {
        alias: {
            "@": "/src/client",
            "@server": "/src/server",
        },
    },
    optimizeDeps: {
        include: ["socket.io-client"],
    },
    define: {
        "process.env": {},
    },
    appType: "spa",
});

if (multiplayerSupport && !noServer) {
    socket(port);
}
