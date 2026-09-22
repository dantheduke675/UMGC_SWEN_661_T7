# care_connect_flutter_frontend

This is the flutter front end for the CareConnect application

## Running the Application

There are multiple ways to run the application first run

```
flutter pub get
```

this will make sure that all your application dependencies are up to date.

Next use

```
flutter run -d chrome
```

to run the application in Google Chrome.

## Building the application

There are multiple ways to build the application first run

```
flutter pub get
```

this will make sure that all your application dependencies are up to date.

Next use

```
flutter build
```

and select which type of application you wish to build.

## Running Tests

The suite runs at three levels. The first needs nothing but Flutter; the other
two need a connected device or emulator.

```
flutter test                                  # 606 widget/unit/a11y tests
flutter test integration_test -d <device-id>  # 40 on-device workflow tests
maestro test .maestro --debug-output .maestro/artifacts   # 5 E2E flows
```

or a single file with:

```
flutter test <path to file>
```

The Maestro flows drive the installed APK through Android's accessibility
tree, so the app must be built with semantics on — see
[`.maestro/README.md`](.maestro/README.md):

```
flutter build apk --debug --dart-define=E2E_SEMANTICS=true
adb install -r build/app/outputs/flutter-apk/app-debug.apk
```

## Test Coverage Report

`coverage/` is git-ignored, so the generated report is not committed. The
per-file summary is, at [`evidence/coverage-summary.txt`](evidence/coverage-summary.txt).
Regenerate both with:

```
flutter test --coverage
dart run tool/coverage_summary.dart --out=evidence/coverage-summary.txt
```

`tool/coverage_summary.dart` needs no extra tooling and exits non-zero if
coverage falls below 75% (`--min=` moves the gate). For a browsable HTML
report instead, `genhtml coverage/lcov.info -o coverage/html` still works
where `lcov` is installed.

**As of 2026-09-21: 98.90% line coverage (1,795 of 1,815 lines), 606 tests
passing, `flutter analyze` clean.**

## Accessibility

The app targets **WCAG 2.1 Level AA**. The full record — what was changed,
what was measured before and after, and how each criterion is verified — is in
[`ACCESSIBILITY.md`](ACCESSIBILITY.md).

Testing is in four layers:

| Layer | Checks |
|---|---|
| `test/accessibility/` | Contrast, semantics, keyboard, focus, text scaling, status messages |
| `integration_test/` | The same, on a real device, across screens |
| `.maestro/` | The platform accessibility tree, as TalkBack reads it |
| `tool/talkback_walk.sh` | A real TalkBack pass; transcript in [`evidence/`](evidence/) |

A TalkBack pass was run on an Android 17 emulator: 11 screens, 154 nodes
reachable, **0 unnamed controls**. VoiceOver has not been run — no macOS or
iOS device is available to this project. Both are covered in `ACCESSIBILITY.md` §8.

## Troubleshooting

On Windows, Flutter's build process relies on symlinks, which are restricted to administrators by default. If `flutter run`/`flutter build` fails with a symlink-related error, enable Developer Mode via:

```
start ms-settings:developers
```

Additionally, Flutter may give some warning when building the apk ios it should build; however, if you do not want the warnings you can use.
```
flutter build apk --enable-native-access=ALL-UNNAMED
```

## Known Issues / Limitations

- No backend/API integration yet — all data is static/in-memory (see `lib/data.dart`).
- No CI/CD pipeline; run `flutter test` and regenerate coverage locally before opening a PR.

### AI Disclosure:

The code in this project was written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code has been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
