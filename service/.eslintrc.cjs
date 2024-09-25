module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.*?.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 2021,
  },
  plugins: ['@typescript-eslint', 'eslint-plugin', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:eslint-plugin/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': 'error',
    'no-const-assign': 'error',
  },
  env: {
    es2021: true,
    jest: true,
    node: true, //adds things like process to global
  },
};
