import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        reduce_vars: true,
        dead_code: true,
        collapse_vars: true,
        evaluate: true,
        unused: true,
        booleans: true
      },
      format: {
        beautify: false,
        comments: false,
        indent_level: 0
      }
    }
  }
})
