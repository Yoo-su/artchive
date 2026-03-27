import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/features/**/index.ts', 'src/features/**/query-keys.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
});
