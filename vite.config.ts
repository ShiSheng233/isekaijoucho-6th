import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0", // 允许局域网访问
    port: 14799,
    open: true,
  },
  plugins: [vue()],
  define: {
    // 防止移动端下拉刷新
    __VUE_PROD_DEVTOOLS__: false,
  },
  base: "./", // 使用相对路径
});
