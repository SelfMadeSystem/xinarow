// vite.config.ts
import { defineConfig } from "vite";

// src/server/socket.ts
import { Server } from "socket.io";
function socket(server) {
  const io = new Server(server, {
    allowEIO3: true,
    cors: {
      origin: "*"
    }
  });
  io.on("connection", (socket2) => {
    console.log("a user connected");
    socket2.on("disconnect", () => {
      console.log("user disconnected");
    });
    socket2.on("chat message", (msg) => {
      console.log("message: ", msg);
      io.emit("chat message", msg);
    });
  });
  return io;
}

// vite.config.ts
var port = 3e3;
var socketPort = port + 1;
var vite_config_default = defineConfig({
  root: "src/client/",
  server: {
    port,
    https: false,
    proxy: {
      "/socket.io": {
        target: `ws://localhost:${socketPort}`,
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: "../../dist/",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": "/src/client",
      "@server": "/src/server"
    }
  },
  optimizeDeps: {
    include: ["socket.io-client"]
  },
  define: {
    "process.env": {}
  },
  appType: "spa"
});
socket(socketPort);
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL3NlcnZlci9zb2NrZXQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2RhdGEvUHJvamVjdHMvVFMveGluYXJvd1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9kYXRhL1Byb2plY3RzL1RTL3hpbmFyb3cvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9kYXRhL1Byb2plY3RzL1RTL3hpbmFyb3cvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IG1rY2VydCBmcm9tICd2aXRlLXBsdWdpbi1ta2NlcnQnXG5pbXBvcnQgc29ja2V0IGZyb20gJy4vc3JjL3NlcnZlci9zb2NrZXQnXG5cbmNvbnN0IHBvcnQgPSAzMDAwXG5jb25zdCBzb2NrZXRQb3J0ID0gcG9ydCArIDFcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICAvLyBwbHVnaW5zOiBbbWtjZXJ0KCldLFxuICAgIHJvb3Q6IFwic3JjL2NsaWVudC9cIixcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgcG9ydDogcG9ydCxcbiAgICAgICAgaHR0cHM6IGZhbHNlLFxuICAgICAgICBwcm94eToge1xuICAgICAgICAgICAgJy9zb2NrZXQuaW8nOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBgd3M6Ly9sb2NhbGhvc3Q6JHtzb2NrZXRQb3J0fWAsXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgIHdzOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICAgIG91dERpcjogXCIuLi8uLi9kaXN0L1wiLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgICdAJzogJy9zcmMvY2xpZW50JyxcbiAgICAgICAgICAgICdAc2VydmVyJzogJy9zcmMvc2VydmVyJyxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgICBpbmNsdWRlOiBbJ3NvY2tldC5pby1jbGllbnQnXSxcbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgICAncHJvY2Vzcy5lbnYnOiB7fSxcbiAgICB9LFxuICAgIGFwcFR5cGU6ICdzcGEnLFxufSlcblxuc29ja2V0KHNvY2tldFBvcnQpIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2RhdGEvUHJvamVjdHMvVFMveGluYXJvdy9zcmMvc2VydmVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2RhdGEvUHJvamVjdHMvVFMveGluYXJvdy9zcmMvc2VydmVyL3NvY2tldC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vbW50L2RhdGEvUHJvamVjdHMvVFMveGluYXJvdy9zcmMvc2VydmVyL3NvY2tldC50c1wiO2ltcG9ydCB7IFNlcnZlciB9IGZyb20gJ3NvY2tldC5pbyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNvY2tldChzZXJ2ZXI/OiBhbnkpIHtcbiAgICBjb25zdCBpbyA9IG5ldyBTZXJ2ZXIoc2VydmVyLCB7XG4gICAgICAgIGFsbG93RUlPMzogdHJ1ZSxcbiAgICAgICAgY29yczoge1xuICAgICAgICAgICAgb3JpZ2luOiAnKicsXG4gICAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBpby5vbignY29ubmVjdGlvbicsIChzb2NrZXQpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ2EgdXNlciBjb25uZWN0ZWQnKTtcblxuICAgICAgICBzb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndXNlciBkaXNjb25uZWN0ZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc29ja2V0Lm9uKCdjaGF0IG1lc3NhZ2UnLCAobXNnKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbWVzc2FnZTogJywgbXNnKTtcbiAgICAgICAgICAgIGlvLmVtaXQoJ2NoYXQgbWVzc2FnZScsIG1zZyk7XG4gICAgICAgIH0pXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW87XG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5USxTQUFTLG9CQUFvQjs7O0FDQU4sU0FBUyxjQUFjO0FBRXhTLFNBQVIsT0FBd0IsUUFBYztBQUN6QyxRQUFNLEtBQUssSUFBSSxPQUFPLFFBQVE7QUFBQSxJQUMxQixXQUFXO0FBQUEsSUFDWCxNQUFNO0FBQUEsTUFDRixRQUFRO0FBQUEsSUFDWjtBQUFBLEVBQ0osQ0FBQztBQUVELEtBQUcsR0FBRyxjQUFjLENBQUNBLFlBQVc7QUFDNUIsWUFBUSxJQUFJLGtCQUFrQjtBQUU5QixJQUFBQSxRQUFPLEdBQUcsY0FBYyxNQUFNO0FBQzFCLGNBQVEsSUFBSSxtQkFBbUI7QUFBQSxJQUNuQyxDQUFDO0FBRUQsSUFBQUEsUUFBTyxHQUFHLGdCQUFnQixDQUFDLFFBQVE7QUFDL0IsY0FBUSxJQUFJLGFBQWEsR0FBRztBQUM1QixTQUFHLEtBQUssZ0JBQWdCLEdBQUc7QUFBQSxJQUMvQixDQUFDO0FBQUEsRUFDTCxDQUFDO0FBRUQsU0FBTztBQUNYOzs7QURwQkEsSUFBTSxPQUFPO0FBQ2IsSUFBTSxhQUFhLE9BQU87QUFFMUIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFFeEIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ0o7QUFBQSxJQUNBLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNILGNBQWM7QUFBQSxRQUNWLFFBQVEsa0JBQWtCO0FBQUEsUUFDMUIsY0FBYztBQUFBLFFBQ2QsSUFBSTtBQUFBLE1BQ1I7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0gsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLO0FBQUEsTUFDTCxXQUFXO0FBQUEsSUFDZjtBQUFBLEVBQ0o7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNWLFNBQVMsQ0FBQyxrQkFBa0I7QUFBQSxFQUNoQztBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osZUFBZSxDQUFDO0FBQUEsRUFDcEI7QUFBQSxFQUNBLFNBQVM7QUFDYixDQUFDO0FBRUQsT0FBTyxVQUFVOyIsCiAgIm5hbWVzIjogWyJzb2NrZXQiXQp9Cg==
