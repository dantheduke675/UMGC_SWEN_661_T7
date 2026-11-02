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

As of 2026-11-02: 25 test files, 256 tests passing, 99.7% line coverage, lint
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
- Import `TouchableOpacity` from `src/components/Touchable.tsx`, not from
  `react-native`. It is the same control with a visible keyboard focus ring
  (Android keyboard / D-pad and the web build); React Native's own version
  never reports focus on a phone.
- Give buttons that hold text a `minHeight`, not a `height`, and don't cut
  essential text off with `numberOfLines`, so large system text can grow
  without clipping (`__tests__/TextScaling.test.tsx` checks this).
- Show a form error as text under its field with `AuthField`'s `error` prop
  (it is announced as an alert) and say how to fix it; see
  `src/constants/validation.ts`.
