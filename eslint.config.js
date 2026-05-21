// ESLint 代码质量配置，覆盖 Vue 与 TypeScript 文件。
import js from "@eslint/js";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import pluginVue from "eslint-plugin-vue";
import typescriptEslint from "typescript-eslint";

export default [
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,vue}"],
  },
  {
    name: "app/files-to-ignore",
    ignores: ["dist/**", "coverage/**", "node_modules/**", "src/auto-imports.d.ts", "src/components.d.ts"],
  },
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
  },
  skipFormatting,
  {
    rules: {
      "no-undef": "off",
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
