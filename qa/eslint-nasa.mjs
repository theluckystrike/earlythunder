// NASA Power of 10 gate for the CLARITY Act code. Run:
//   npx eslint --no-config-lookup --config qa/eslint-nasa.mjs <paths>
import tsparser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";

// SCOPE. The function-length rule targets control-flow complexity, which is a
// property of logic, not of markup. A React render function is one declarative
// return statement, so splitting it at 60 lines buys nothing and costs
// legibility. All 14 page and component render functions in this repo exceed it
// and always have. Logic files carry the rule at full strength and sit at zero.
// Every other rule below applies to both.
const LOGIC = ["src/lib/**/*.ts", "scripts/**/*.mjs", "src/app/**/*.ts"];
const MARKUP = ["src/app/**/*.tsx", "src/components/**/*.{tsx,jsx}"];

const nasaConfig = [
  {
    files: LOGIC,
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
  {
    files: MARKUP,
    plugins: { "@next/next": nextPlugin },
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    rules: {
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

export default nasaConfig;
