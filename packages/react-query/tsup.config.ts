import { baseConfig, defineConfig } from "../tsup.config.base";

export default defineConfig({
  ...baseConfig,
  entry: [
    "src/index.ts",
    "src/features/**/index.ts",
    "src/features/**/query-keys.ts",
  ],
  banner: {
    js: '"use client";',
  },
});
