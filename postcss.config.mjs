import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Raiz absoluta do repo. Em Windows, com caminhos com espaço (ex.: Users\Gabriel Carrara\...),
 * o Tailwind v4 pode resolver `@import "tailwindcss"` no diretório errado e falhar com
 * "Can't resolve 'tailwindcss' in 'C:\Users\Gabriel Carrara'".
 *
 * Não importe `@tailwindcss/postcss` aqui em ESM — o Next/Turbopack tenta empacotar o plugin
 * e quebra (lightningcss .node). O formato em objeto deixa o PostCSS carregar o plugin em runtime.
 */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: projectRoot,
    },
  },
};

export default config;
