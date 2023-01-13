import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
});
