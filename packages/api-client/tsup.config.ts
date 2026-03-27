import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/features/**/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: true,
});
