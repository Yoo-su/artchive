import tseslint from "typescript-eslint";

import sharedConfig from "../../eslint.config.mjs";

export default tseslint.config(...sharedConfig, {
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
