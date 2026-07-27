// NASA Power of 10 gate for the CLARITY Act code. Run:
//   npx eslint --no-config-lookup --config qa/eslint-nasa.mjs <paths>
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    rules: {
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-unreachable": "error",
      "no-constant-condition": "error",
      "no-loss-of-precision": "error",
    },
  },
];
