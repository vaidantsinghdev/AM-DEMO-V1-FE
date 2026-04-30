const { defineConfig } = require("vite");
const { resolve } = require("path");

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        clients: resolve(__dirname, "clients.html"),
        client: resolve(__dirname, "client.html"),
      },
    },
  },
});
