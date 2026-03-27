import { baseConfig, defineConfig } from "../tsup.config.base";

export default defineConfig({
  ...baseConfig,
  entry: [
    "src/index.ts",
    "src/features/**/index.ts",
    "src/features/**/types.ts",
    "src/features/**/constants.ts",
    "src/shared/index.ts",
  ],
});
