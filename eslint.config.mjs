import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintConfigPrettier from 'eslint-config-prettier';
import moyanPlugin from './tools/eslint-plugin-moyan/index.cjs';

const targetFiles = [
  'packages/**/*.{ts,tsx,js,cjs,mjs,vue}',
  'backend/**/*.{ts,tsx,js,cjs,mjs,vue}',
  'frontend/**/*.{ts,tsx,js,cjs,mjs,vue}',
  'api/**/*.{ts,tsx,js,cjs,mjs,vue}',
  'examples/**/*.{ts,tsx,js,cjs,mjs,vue}',
];

export default [
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.tsbuildinfo', '.git/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: targetFiles,
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue', '.tsx'],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      jsdoc,
      moyan: moyanPlugin,
    },
    rules: {
      'moyan/comment-compliance': 'error',
      'jsdoc/require-jsdoc': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
    },
  },
  // TSX 组件规范
  {
    files: ['packages/base/src/frontend/components/**/*.tsx', 'packages/base/src/frontend/components/**/index.ts'],
    rules: {
      // 组件名必须使用 Mfw 前缀
      'vue/multi-word-component-names': ['error', {
        registeredComponents: ['MfwDateFormat', 'MfwImageFormat', 'MfwDictFormat', 'MfwTagFormat', 'MfwFormat']
      }],
    },
  },
  {
    files: ['**/*.d.ts', '**/types/**/*.ts', '**/*-types.ts'],
    rules: {
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['packages/base-api/src/**/*controller.ts', 'api/src/**/*controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/swagger',
              message: '控制器文档注解请统一从 moyan-mfw-core 导入。',
            },
            {
              name: '@nestjs/common',
              importNames: ['Req', 'Res', 'Request', 'Response'],
              message: '共享控制定义层禁止使用 Request/Response 注解参数。',
            },
            {
              name: 'moyan-mfw-core',
              importNames: [
                'MfwOkResponse',
                'MfwCreatedResponse',
                'MfwBadRequestResponse',
                'MfwUnauthorizedResponse',
                'MfwForbiddenResponse',
                'MfwNotFoundResponse',
                'MfwInternalServerErrorResponse',
              ],
              message: '控制器响应文档请统一使用 ApiResponse 注解。',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Decorator > CallExpression[callee.name=/^Mfw(Ok|Created|BadRequest|Unauthorized|Forbidden|NotFound|InternalServerError)Response$/]',
          message: '控制器响应文档请统一使用 ApiResponse 注解。',
        },
        {
          selector: 'Decorator > CallExpression[callee.name=/^(Req|Res|Request|Response|User)$/]',
          message: '共享控制定义层禁止声明 Request/Response/User 注解参数。',
        },
      ],
    },
  },
  eslintConfigPrettier,
];
