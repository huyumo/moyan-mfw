module.exports = {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  overrides: [
    {
      files: '*.scss',
      options: {
        singleQuote: false,
        trailingComma: 'none',
      },
    },
  ],
};
