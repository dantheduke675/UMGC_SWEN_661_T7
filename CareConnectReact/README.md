# CareConnect (React Native)

The React Native / Expo version of CareConnect, for iOS, Android and the web.
The full guide (architecture, navigation, building with EAS, Maestro, screen
reader testing, security notes and known issues) is in the **React** section of
the [repository README](../README.md).

## Run it

```
npm install
npm start          # Expo dev server; press a (Android), i (iOS) or w (web)
npm run web        # straight to the browser
```

## Check it

| Command                 | What it does                                                      |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run test:ci`       | All Jest tests once (`npm test` watches instead)                   |
| `npm run test:coverage` | The same with coverage of `App.tsx` and `src/`; fails under 60%    |
| `npm run lint`          | ESLint (Expo config) over source and tests                         |
| `npx tsc --noEmit`      | Type check                                                        |
| `npx expo export --platform android --platform web` | Bundles the app, a quick check that it builds |

As of 2026-10-29: 23 test files, 215 tests passing, 100% line coverage, lint
and type check clean.

## Accessibility notes for contributors

- Use `aria-*` props for state (`aria-checked`, `aria-selected`,
  `aria-disabled`, `aria-expanded`, `aria-valuenow`), not `accessibilityState`
  or `accessibilityValue`: react-native-web drops those objects, so the state
  never reaches the DOM on the web. React Native supports the `aria-*` props
  on iOS and Android too.
- For a button that toggles, spread `selectedButtonState(isOn)` from
  `src/constants/a11y.ts` (selected on phones, `aria-pressed` on the web).
- Draw accent colours as text through `accessibleAccentText()` in
  `src/constants/theme.ts`, passing the tint when the text sits on one;
  `CChip` does this itself.
