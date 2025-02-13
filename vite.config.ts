import { defineConfig } from "vite";
import socket, { getRooms } from "./src/server/socket";

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
                      "/rooms": {
                          configure(proxy, options) {
                              proxy.on("start", async (req, res, target) => {
                                  if (req.url === "/rooms") {
                                      res.setHeader(
                                          "content-type",
                                          "application/json"
                                      );
                                      res.end(JSON.stringify(getRooms()));
                                  }
                              });
                          },
                          target: `http://localhost:${port}`,
                      },
                  },
              }
            : {}),
    },
    preview: {
        allowedHosts: true, // it's not a critical app, so we can allow all hosts
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
