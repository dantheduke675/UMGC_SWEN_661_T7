// ESLint flat config — https://docs.expo.dev/guides/using-eslint/
// Run with `npm run lint` (or `npm run lint:fix` to auto-fix).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,

  {
    // Generated, vendored, and build output — never linted.
    ignores: [
      'dist/*',
      'coverage/*',
      'node_modules/*',
      '.expo/*',
      'android/*',
      'ios/*',
      'scripts/reset-project.js',
    ],
  },

  {
    // Jest injects describe/it/expect/jest as globals in the test suite.
    files: ['__tests__/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);
