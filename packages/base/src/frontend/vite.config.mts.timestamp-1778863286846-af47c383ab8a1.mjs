// vite.config.mts
import { defineConfig } from "file:///E:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.15_sass@1.98.0_terser@5.46.1/node_modules/vite/dist/node/index.js";
import vue from "file:///E:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_9f6d87bc469e48a3a901d324a6b9f991/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///E:/Moyan/moyan/moyan-mfw-workspace/workspace04/moyan-mfw/node_modules/.pnpm/@vitejs+plugin-vue-jsx@5.1._80facc8d0271c2b7c60d1186f3160792/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "E:\\Moyan\\moyan\\moyan-mfw-workspace\\workspace04\\moyan-mfw\\packages\\base\\src\\frontend";
var vite_config_default = defineConfig({
  root: ".",
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  build: {
    outDir: "../../dist/frontend",
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => format === "es" ? "index.mjs" : "index.js"
    },
    rollupOptions: {
      external: ["vue", "vue-router", "element-plus", "@element-plus/icons-vue", "pinia", "@vueuse/core", "axios", "md-editor-v3", "quill", "vue-advanced-cropper"],
      output: {
        exports: "named",
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "element-plus": "ElementPlus",
          pinia: "Pinia"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcTW95YW5cXFxcbW95YW5cXFxcbW95YW4tbWZ3LXdvcmtzcGFjZVxcXFx3b3Jrc3BhY2UwNFxcXFxtb3lhbi1tZndcXFxccGFja2FnZXNcXFxcYmFzZVxcXFxzcmNcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXE1veWFuXFxcXG1veWFuXFxcXG1veWFuLW1mdy13b3Jrc3BhY2VcXFxcd29ya3NwYWNlMDRcXFxcbW95YW4tbWZ3XFxcXHBhY2thZ2VzXFxcXGJhc2VcXFxcc3JjXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovTW95YW4vbW95YW4vbW95YW4tbWZ3LXdvcmtzcGFjZS93b3Jrc3BhY2UwNC9tb3lhbi1tZncvcGFja2FnZXMvYmFzZS9zcmMvZnJvbnRlbmQvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSc7XG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICByb290OiAnLicsXG4gIHBsdWdpbnM6IFt2dWUoKSwgdnVlSnN4KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4uLy4uL2Rpc3QvZnJvbnRlbmQnLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ2NqcyddLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGZvcm1hdCA9PT0gJ2VzJyA/ICdpbmRleC5tanMnIDogJ2luZGV4LmpzJyxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ2VsZW1lbnQtcGx1cycsICdAZWxlbWVudC1wbHVzL2ljb25zLXZ1ZScsICdwaW5pYScsICdAdnVldXNlL2NvcmUnLCAnYXhpb3MnLCAnbWQtZWRpdG9yLXYzJywgJ3F1aWxsJywgJ3Z1ZS1hZHZhbmNlZC1jcm9wcGVyJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZXhwb3J0czogJ25hbWVkJyxcbiAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgIHZ1ZTogJ1Z1ZScsXG4gICAgICAgICAgJ3Z1ZS1yb3V0ZXInOiAnVnVlUm91dGVyJyxcbiAgICAgICAgICAnZWxlbWVudC1wbHVzJzogJ0VsZW1lbnRQbHVzJyxcbiAgICAgICAgICBwaW5pYTogJ1BpbmlhJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpYyxTQUFTLG9CQUFvQjtBQUM5ZCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztBQUFBLEVBQ3pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3hDLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixVQUFVLENBQUMsV0FBVyxXQUFXLE9BQU8sY0FBYztBQUFBLElBQ3hEO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsT0FBTyxjQUFjLGdCQUFnQiwyQkFBMkIsU0FBUyxnQkFBZ0IsU0FBUyxnQkFBZ0IsU0FBUyxzQkFBc0I7QUFBQSxNQUM1SixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsUUFDVCxTQUFTO0FBQUEsVUFDUCxLQUFLO0FBQUEsVUFDTCxjQUFjO0FBQUEsVUFDZCxnQkFBZ0I7QUFBQSxVQUNoQixPQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
