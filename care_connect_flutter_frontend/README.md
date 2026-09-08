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

Run the full suite with:

```
flutter test
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

## Known Issues / Limitations

- No backend/API integration yet — all data is static/in-memory (see `lib/data.dart`).
- No CI/CD pipeline; run `flutter test` and regenerate coverage locally before opening a PR.

### AI Disclosure:

The code in this project was written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code has been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
