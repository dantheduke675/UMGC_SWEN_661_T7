# UMGC_SWEN_661_T7

# Team 7 - Team Double Dip - CareConnect Repository

## CareConnect Application - A mobile application to connect Patients and Care Givers who can monitor health, connect with resources and professionals, track tasks and medications, and enhance overall quality of life. This specific version of Care Connect focuses on care recipients who experience parkinsonian symptoms (an essential or pill like tremor).

### Team Members:

Justin Welsh  
Daniel Martin  
Ashvini Tandale

### Team Charter Link: [HERE](https://umuc365-my.sharepoint.com/:w:/g/personal/dguerreromartin_student_umgc_edu/IQBJi-GDoxg2TopXWVh7sYRzATRPniwq0isIp623mE6ZLn8?e=m2bmOs)

### Setup Instructions:

Firstly, the user should cone this repository they can do this in a few ways

```
git clone https://github.com/dantheduke675/UMGC_SWEN_661_T7.git
```

or

```
git clone git@github.com:dantheduke675/UMGC_SWEN_661_T7.git
```

From there navigate to the respective front end directory and run the correspond files below is a breakdown for each language in how to run and or build the respective frontend.

# Flutter:

## Navigation

First when in the home directory navigate to the main flutter front end using the

```
cd ./care_connect_flutter_frontend
```

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

and select which type of application you wish to build. For example building an android application you would use

```
flutter build apk
```

If you were on a device that used MacOS you could build an IOS application using

```
flutter build ios
```

to install the android version of the application you can drag and drop it into an android studio emulator or run/build it while connected to an android device

## Running Tests

Run the full suite with:

```
flutter test
```

or all unit tests with

```
flutter test ./test/unit
```

or all widget tests with

```
flutter test ./test/widget
```

or a single file with:

```
flutter test <path to file>
```

## Test Coverage Report

`coverage/` is git-ignored, so there is no hosted report — generate one locally:

```
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

Then open `coverage/html/index.html` in a browser (requires `lcov`/`genhtml` installed). As of 2026-09-08, overall line coverage is 96.0% (1,524 of 1,587 lines).

## Troubleshooting

On Windows, Flutter's build process relies on symlinks, which are restricted to administrators by default. If `flutter run`/`flutter build` fails with a symlink-related error, enable Developer Mode via:

```
start ms-settings:developers
```

This will open the developers setting screen in the windows settings and allow the user to turn on the developer settings

Additionally, Flutter may give some warning when building the apk ios it should build; however, if you do not want the warnings you can use.

```
flutter build apk --enable-native-access=ALL-UNNAMED
```

## Known Issues / Limitations

- No backend/API integration yet — all data is static/in-memory (see `lib/data.dart`).
- No CI/CD pipeline; run `flutter test` and regenerate coverage locally before opening a PR.

# Electron:

<TODO>

# React:

The React front end is an [Expo](https://docs.expo.dev/) / React Native application written in TypeScript. The same codebase runs on Android, iOS, and the web.

## Navigation

First when in the home directory navigate to the main react front end using the

```
cd ./CareConnectReact
```

## Running the Application

There are multiple ways to run the application first run

```
npm install
```

this will make sure that all your application dependencies are up to date.

Next use

```
npm run web
```

to run the application in your default browser.

To run on a device or emulator without a native build, use

```
npm start
```

which starts the Metro bundler and prints a menu of targets — press `a` for an Android emulator, `i` for an iOS simulator (macOS only), or `w` for web. You can also scan the QR code with the Expo Go app to open the application on a physical phone. You will find out how to run straight into a specific emulator in the build section as the commands that use npm run typically both build and run the application

## Building the application

There are multiple ways to build the application first run

```
npm install
```

this will make sure that all your application dependencies are up to date.

To build the web version use

```
npx expo export -p web
```

this writes a static site to `dist/`, which can be served by any static web server.

To build and install a native android application use

```
npx expo run:android
```

This generates the native `android/` project, compiles a debug build, and installs it onto a connected Android device or a running Android Studio emulator. The generated `android/` and `ios/` folders are git ignored, so they are recreated on demand rather than committed.

You can also specify release and debug versions of the application using

```
npx expo run:android --variant release
npx expo run:android --variant debug
```

If you were on a device that used MacOS you could build an IOS application using

```
npx expo run:ios
```

For a distributable release build (for example a standalone APK or ABB) use EAS Build. There is no `eas.json` in the repository yet, so it has to be configured once before the first build:

```
npx eas build:configure
npx eas build -p android --profile preview
```

### Note 1. that EAS requires a free Expo account and runs the build in the cloud by default.

### Note 2. Though not necessary opening an emulator in android studio when building the android application will automatically boot the app into the running emulator making testing easier.

## Running Tests

Run the full suite with:

```
npm run test:ci
```

or in watch mode while developing with

```
npm test
```

`npm test` maps to `jest --watchAll`, so it stays running and re-runs on every file change — use `npm run test:ci` when you want a single pass.

Run a single file with:

```
npx jest __tests__/<file name>
```

or every test whose name matches a string with:

```
npx jest -t "<test name>"
```

All tests live in `__tests__/`, with one file per screen, component, hook, and data module.

## Linting

Linting is enforced with [ESLint](https://eslint.org/) using Expo's shared config. Check the whole project with:

```
npm run lint
```

or let ESLint fix what it can automatically with:

```
npm run lint:fix
```

Rules are configured in `eslint.config.js`, which extends `eslint-config-expo/flat` and adds the Jest globals for `__tests__/`. Build output (`dist/`, `coverage/`, `android/`, `ios/`) is excluded.

Note the trailing `.` in the script — a bare `expo lint` only checks `src/`, `app/`, and `components/`, which would silently skip `__tests__/`. With the path argument all 42 source and test files are linted, and the project currently reports zero errors and zero warnings.

## Test Coverage Report

`coverage/` is git-ignored, so there is no hosted report — generate one locally:

```
npx jest --coverage --forceExit --collectCoverageFrom="src/**/*.{ts,tsx}"
```

You can alternatively use 

```
npm test -- --coverage
```

Then open `coverage/lcov-report/index.html` in a browser. Unlike the Flutter report this needs no extra tooling — Jest writes the HTML itself. As of 2026-09-14 the suite is 19 files / 117 tests, all passing, and overall line coverage is 92.4% (461 of 499 lines).

## Troubleshooting

Jest prints `A worker process has failed to exit gracefully` at the end of a run. This is a teardown leak in the React Native test environment, not a test failure, and it is why the `test:ci` script and the coverage command above pass `--forceExit`.

A cold run with `--coverage` occasionally fails a suite or two on timing alone, because Babel instruments every file on the first pass. Re-running usually passes; if it does not, clear the Jest cache with

```
npx jest --clearCache
```

If Metro serves stale code after a dependency or config change, restart the bundler with a cleared cache using

```
npx expo start --clear
```

ESLint's React Compiler rules reject the older `useRef(new Animated.Value(0)).current` idiom with `Cannot access refs during render`. Use React Native's `useAnimatedValue()` hook instead — it is the supported replacement and is already used throughout `src/`.

The test output contains `SafeAreaView has been deprecated` warnings from React Native. These are noise from the current component implementation and do not fail the suite.

## Known Issues / Limitations

- No backend/API integration yet — all data is static/in-memory (see `src/constants/data.ts`).
- No CI/CD pipeline; run `npm run test:ci` and regenerate coverage locally before opening a PR.
- No EAS build profile is committed, so release builds require a one-time `eas build:configure`.
- Some of the packages used have depreciated and are depreciating soon however the application still builds just with warnings

# Weekly Contributions 09/02-09/08

## Daniel

- Worked to build out majority of the testing Suite
- Designed the landing, create account, sign in screens, and biometric face id screens
- Contributed alot of comments
- Worked on the README
- Took the screenshots in the screenshots document
- Built the application

## Justin

- Designed the Today, Medications, Messages, and Message thread screens
- Implemented the undo functionality across the application
- Implemented the accessibility scroll bar across the bottom of the screen
- Implemented message persistence and message unread state
- Added some unit testing to the suite Daniel started.
- Enabled Synchorous tile status across the Today and the Medication screens
- Contributed to the README

## Ashvini

- Designed the Schedule, Symptoms, Account and calling screens
- Reviewed the screenshot document and made adjustments
- Tested the app

# Weekly Contributions 09/09-09/15

## Daniel

- Worked to build out all of the testing Suite
- Worked to build the undo history/stack
- Fixed the navigation to the calling screen from the msg thread screen
- Fixed the display of the light vs dark mode button
- Fixed the Navigation on the application sign out button
- Completed the react test coverage/screenshot document
- Worked some on the comparison document
- Added some smaller notes to the README

## Justin

- Worked on the README
- Designed the landing, create account, sign in screens, and biometric face id, Today, Medications, Messages, and Message thread screens
- Implemented the undo functionality across the application
- Implemented the accessibility scroll bar across the bottom of the screen
- Configured eslint for the project

## Ashvini
- Designed the Symptoms, Schedule, Account, and Calling screens
- Worked on the comparison document
- Tested the app locally.

### AI Disclosure: The code in this project was written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code has been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
