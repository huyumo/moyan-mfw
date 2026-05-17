// @ts-check
const { defineConfig } = require('moyan-api/config');

module.exports = defineConfig({
  backendUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  outputDir: './src/apis',
  namespace: 'test-ext',
});
