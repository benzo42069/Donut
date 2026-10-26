import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'shots/', 'reviews/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Harness scripts run in Node but also pass callbacks to page.evaluate().
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // Art rule: every voxel color comes from src/art/palette.ts.
    files: ['src/**/*.ts'],
    ignores: ['src/art/palette.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Colors must come from src/art/palette.ts (art bible §4).',
        },
      ],
    },
  },
  prettier,
);
