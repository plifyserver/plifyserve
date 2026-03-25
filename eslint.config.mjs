import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next/React Compiler: padrões comuns (fetch em useEffect, tema, portal, matchMedia)
      // disparam falsos positivos; o projeto já usa cancelamento e efeitos idiomáticos.
      'react-hooks/set-state-in-effect': 'off',
      // Callback refs + cloneElement (menus estilo shadcn) disparam falso positivo.
      'react-hooks/refs': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
