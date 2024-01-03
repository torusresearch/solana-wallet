require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["@toruslabs/vue"],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["*.cjs", "*.config.js", "vite.config.ts", "importLocales.js", "__generated__", ".eslintrc.js", "crisp.js", "tests/setup.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": 1,
    camelcase: 0,
    "no-new": 0,
    "vue/multi-word-component-names": 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "typeLike",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
      },
    ],
    quotes: 0,
    "@typescript-eslint/quotes": [2, "double"],
    "no-console": 2,
    "@typescript-eslint/comma-dangle": 0,
    "mocha/no-global-tests": ["off"],
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    "import/extensions": 0,
    "prettier/prettier": [
      2,
      {
        singleQuote: false,
        printWidth: 150,
        semi: true,
        trailingComma: "es5",
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
};
