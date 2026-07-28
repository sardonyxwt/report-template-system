import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import { configs } from 'typescript-eslint';

const localRules = {
  rules: {
    'parameter-decorator-newline': {
      meta: {
        type: 'layout',
        docs: {
          description:
            'Require decorated parameters to start on the line after their decorator.',
        },
        fixable: 'whitespace',
        schema: [],
        messages: {
          parameterDecoratorNewline:
            'Move the parameter declaration to the line after its decorator.',
        },
      },
      create(context) {
        const sourceCode = context.sourceCode;

        function check(node) {
          const decorators = node.decorators;

          if (!decorators?.length) {
            return;
          }

          const lastDecorator = decorators[decorators.length - 1];
          const parameterToken = sourceCode.getTokenAfter(lastDecorator);

          if (
            !parameterToken ||
            lastDecorator.loc.end.line !== parameterToken.loc.start.line
          ) {
            return;
          }

          context.report({
            node: lastDecorator,
            messageId: 'parameterDecoratorNewline',
            fix(fixer) {
              const line = sourceCode.lines[lastDecorator.loc.start.line - 1];
              const indent = line.match(/^\s*/)?.[0] ?? '';

              return fixer.replaceTextRange(
                [lastDecorator.range[1], parameterToken.range[0]],
                `\n${indent}`,
              );
            },
          });
        }

        return {
          Identifier: check,
          TSParameterProperty: check,
        };
      },
    },
  },
};

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.nx/**',
      '**/.npm-cache/**',
      '**/coverage/**',
      '**/tmp/**',
      '**/libs/prisma/client/**',
      '**/libs/prisma/src/schema/**',
    ],
  },
  js.configs.recommended,
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  importPlugin.flatConfigs.errors,
  importPlugin.flatConfigs.warnings,
  importPlugin.flatConfigs.typescript,
  ...configs.recommended,
  prettierRecommended,
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
    ],
    plugins: {
      local: localRules,
      'unused-imports': unusedImports,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.base.json',
        },
        node: {
          extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts'],
        },
      },
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.js',
            '*.mjs',
            '*.cjs',
            'apps/*/*.config.js',
            'libs/*/*.config.js',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['platform/prisma/types', 'platform/prisma/client'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'local/parameter-decorator-newline': 'error',
      'import/no-duplicates': [
        'error',
        {
          'prefer-inline': true,
        },
      ],
      'import/no-cycle': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: [
            ['external', 'builtin'],
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: '@prisma/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: 'common-*',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'prisma',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: 'zod',
              group: 'internal',
              position: 'before',
            },
          ],
        },
      ],
      'no-unsafe-optional-chaining': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/jest.config.*', 'jest.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
