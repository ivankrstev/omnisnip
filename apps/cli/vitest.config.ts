import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    exclude: ["dist", "node_modules"],

    // Automatically inherits other settings from root
  },
});
