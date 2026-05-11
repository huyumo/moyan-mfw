import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/*.tsbuildinfo'] },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/backend/**/*.ts', 'tests/**/*.ts'],
    languageOptions: { parserOptions: { project: './tsconfig.backend.json' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/frontend/**/*.ts', 'src/frontend/**/*.vue'],
    languageOptions: { parserOptions: { project: './tsconfig.frontend.json' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
