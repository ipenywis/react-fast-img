import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import reactTransformPlugin from "./plugin/reactTransformPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [react()],
  plugins: [{ ...reactTransformPlugin(), enforce: "pre" }, react()],
});
