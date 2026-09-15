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
    // react-native-web does not re-export every hook that react-native does.
    // Importing one of these from 'react-native' type-checks and bundles fine,
    // then throws "is not a function" the moment the screen renders on web.
    files: ['src/**/*.{ts,tsx}', 'App.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react-native',
          importNames: ['useAnimatedValue'],
          message: "react-native-web does not export this. Import { useAnimatedValue } from the local 'hooks/useAnimatedValue' instead.",
        }],
      }],
    },
  },

  {
    // Jest injects describe/it/expect/jest as globals in the test suite.
    files: ['__tests__/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);
