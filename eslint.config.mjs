import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The App Router root layout owns these site-wide font links. The rule only
    // understands the legacy pages/_document location.
    files: ["src/app/layout.tsx"],
    rules: { "@next/next/no-page-custom-font": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare Worker has its own tsconfig and lint rules:
    "worker/**",
  ]),
]);

export default eslintConfig;
