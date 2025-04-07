import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules } from '@eslint/compat';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores([
    '**/node_modules',
    '**/coverage',
    'gen-documentation/**/*',
    'spec/react_on_rails/dummy-for-generators',
    'spec/dummy',
    'spec/execjs-compatible-dummy',
    'packages/node-renderer/lib/',
    'packages/node-renderer/tests/fixtures',
    'packages/node-renderer/webpack.config.js',
    '**/node_modules/**/*',
    '**/assets/webpack/**/*',
    '**/generated/**/*',
    '**/app/assets/javascripts/application.js',
    '**/coverage/**/*',
    '**/cable.js',
    '**/public/**/*',
    '**/tmp/**/*',
    '**/vendor',
    '**/dist',
    '**/.yalc/',
  ]),
  {
    files: ['**/*.[jt]s', '**/*.m[jt]s', '**/*.[jt]sx'],
    extends: fixupConfigRules(
      compat.extends('eslint:recommended', 'plugin:import/typescript', 'eslint-config-shakacode', 'prettier'),
    ),

    plugins: {
      jest,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        __DEBUG_SERVER_ERRORS__: true,
        __SERVER_ERRORS__: true,
      },

      parserOptions: {
        // We have @babel/eslint-parser from eslint-config-shakacode, but don't use Babel in the main project
        requireConfigFile: false,
      },
    },

    settings: {
      'import/extensions': ['.js', '.ts'],

      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'],
      },

      'import/resolver': {
        node: true,
        typescript: true,
      },
    },

    rules: {
      'no-console': 'off',

      'no-void': [
        'error',
        {
          // Allow using void to suppress errors about misused promises
          allowAsStatement: true,
        },
      ],

      // Allow using void to suppress errors about misused promises
      'no-restricted-syntax': 'off',
      // https://github.com/benmosher/eslint-plugin-import/issues/340
      'import/no-extraneous-dependencies': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
      'import/extensions': 'off',
      'import/prefer-default-export': 'off',
      // incompatible with prettier
      // TODO: double-check, may be false now
      'lines-between-class-members': 'off',
      'no-mixed-operators': 'off',
    },
  },
  {
    files: ['**/*.ts{x,}'],
    extends: compat.extends('plugin:@typescript-eslint/strict-type-checked'),

    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'script',

      parserOptions: {
        project: true,
      },
    },

    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafePromises: [
            {
              from: 'package',
              package: 'fastify',
              name: 'FastifyReply',
            },
          ],
        },
      ],

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
    },
  },
  {
    files: ['packages/node-renderer/tests/**'],

    rules: {
      // Allows Jest mocks before import
      'import/first': 'off',
      // Simplifies test code
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['packages/node-renderer/src/integrations/**'],
    ignores: ['packages/node-renderer/src/integrations/api.ts'],

    rules: {
      // Integrations should only use the public integration API
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../*'],
        },
      ],
    },
  },
]);
