/**
 * Roda no pre-commit (husky).
 * - ESLint só nos arquivos staged.
 * - Typecheck e testes no projeto inteiro: uma mudança pode quebrar outro arquivo.
 */
const config = {
  "*.{ts,tsx,js,mjs}": ["eslint --max-warnings=0"],
  "*.{ts,tsx}": [() => "tsc --noEmit", () => "node --test"],
};

export default config;
