import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import eslint from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['**/node_modules', '**/build/', '**/.nvmrc', '**/api.ts'],
  },
  prettierConfig,
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    ...jestPlugin.configs['flat/recommended'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'commonjs',

      parserOptions: {
        project: 'tsconfig.*?.json',
        tsconfigRootDir: '/Users/aerpenbeck/src/commercetools-connector/service',
      },
    },

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      'no-undef': 'error',
      'no-console': 'error',
      'no-const-assign': 'error',
    },
  },
];
