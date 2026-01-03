// ESLint v9+ uses the “flat config” format by default.
// Note: legacy .eslintrc* configs are deprecated in ESLint 9.

import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const vitestGlobals = {
  afterAll: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  beforeEach: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
  test: 'readonly',
  vi: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.codex/**',
      '.github/**',
      'docs/**',
      'memory/**',
    ],
  },

  // Project-wide language defaults.
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Base JS rules.
  js.configs.recommended,

  // TypeScript rules (non-type-checked). Keep linting fast for Vite.
  ...tseslint.configs.recommended,

  // App/source files.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      ...(reactPlugin.configs.recommended?.rules ?? {}),
      ...(reactPlugin.configs['jsx-runtime']?.rules ?? {}),
      ...(reactHooksPlugin.configs.recommended?.rules ?? {}),

      // React Three Fiber uses custom JSX props/elements.
      'react/no-unknown-property': 'off',

      // This repo uses an ECS and other mutable data for simulation.
      'react-hooks/immutability': 'off',

      // Avoid blocking adoption on existing code; keep this as a warning.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'warn',

      // React 19 + TS: prop-types are redundant.
      'react/prop-types': 'off',

      // Vite Fast Refresh safety.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Test globals.
  {
    files: ['tests/**/*.{ts,tsx}', 'tests-playwright/**/*.{ts,tsx}'],
    languageOptions: {
      globals: vitestGlobals,
    },
  },

  // Disable ESLint formatting rules that conflict with Prettier.
  eslintConfigPrettier,
);
