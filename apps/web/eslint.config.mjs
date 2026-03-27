import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

import sharedConfig from "../../eslint.config.mjs";

const eslintConfig = tseslint.config(
  // 1. 기본적으로 모든 파일에 적용될 TypeScript 규칙
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // 2. Next.js 관련 규칙
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  ...sharedConfig,
);

export default eslintConfig;
