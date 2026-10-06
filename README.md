# UMGC_SWEN_661_T7

# Team 7 - Team Double Dip - CareConnect Repository

## CareConnect Application - A mobile application to connect Patients and Care Givers who can monitor health, connect with resources and professionals, track tasks and medications, and enhance overall quality of life. This specific version of Care Connect focuses on care recipients who experience parkinsonian symptoms (an essential or pill like tremor).

### Team Members:

Justin Welsh  
Daniel Martin  
Ian Ard

### Team Charter Link: [HERE](https://umuc365-my.sharepoint.com/:w:/g/personal/dguerreromartin_student_umgc_edu/IQBJi-GDoxg2TopXWVh7sYRzATRPniwq0isIp623mE6ZLn8?e=m2bmOs)

### Setup Instructions:

First, the user should clone this repository they can do this in a few ways

```
git clone https://github.com/dantheduke675/UMGC_SWEN_661_T7.git
```

or

```
git clone git@github.com:dantheduke675/UMGC_SWEN_661_T7.git
```

From there navigate to the respective front end directory and run the correspond files below is a breakdown for each language in how to run and or build the respective frontend.

# Architecture Overview

CareConnect is implemented three times, once per framework studied in the
course. All three implement the same screens and the same user flows, so they
can be compared directly:

| App          | Folder                           | Platforms                                | Language / UI                                             | Navigation                                                                                      | State                                                                                                                   |
| ------------ | -------------------------------- | ---------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Flutter      | `care_connect_flutter_frontend/` | Android, iOS, web, Windows, macOS, Linux | Dart, Material 3                                          | `go_router` with a `ShellRoute` for the logged-in tabs                                          | `provider` (`ThemeNotifier`, `ActionHistory`) plus in-memory data in `lib/data.dart`                                    |
| React Native | `CareConnectReact/`              | Android, iOS, web                        | TypeScript, Expo SDK 57, React Native 0.86                | `@react-navigation/native-stack` for sign-in, a hand-rolled tab shell (`AppShell.tsx`) after it | React state and context (`ThemeContext`, `ScrollContext`, `useUndoHistory`) plus static data in `src/constants/data.ts` |
| Electron     | `CareConnectElectron/`           | Windows, macOS, Linux desktop            | Plain HTML, CSS and JavaScript (no framework, no bundler) | A small history stack in `src/app.js` (`go` / `back`)                                           | One in-memory `state` object; three UI preferences in `localStorage`                                                    |

All three share these properties:

- **No backend.** Every medication, appointment, message and symptom is
  fictional demo data compiled into the app. Nothing is fetched from or sent to
  a server, and changes are lost when the app restarts.
- **Simulated sign-in.** The sign-in, create-account and Face ID screens are
  UI flows only. No credential is checked, stored or transmitted, and no
  operating-system biometric API is called. See each app's Security Notes.
- **The same screen set.** There are 13 screens: Landing, Create account, Face
  ID intro, Face ID sign-in, Password sign-in, Today, Medications, Schedule,
  Symptoms, Messages, Message thread, Calling and Account.

# Security Overview

CareConnect handles health information: medications that reveal diagnoses,
symptom logs, messages with clinicians and appointments. In a production
deployment that would be protected health information (PHI) under HIPAA.
These builds are **front-end prototypes**, and their security posture follows
from that.

**What protects user data today**

- **No real data.** All data is fictional and ships inside the app.
- **Nothing persists.** Health data lives in memory only. No app writes
  medications, symptoms or messages to disk, `localStorage`, AsyncStorage or
  shared preferences.
- **Nothing is sent over the network.** No app makes API calls. (The one
  exception is font loading in the Flutter app; see its notes.)
- **Nothing is logged.** There are no `print`, `debugPrint` or `console.*`
  calls in the app sources of any of the three apps.
- **No secrets in the repository.** There are no API keys, tokens or `.env`
  files. The root `.gitignore` excludes `.env*`, keystores, `key.properties`,
  `*.apk` and `*.aab`. `CareConnectReact/.gitignore` also excludes `*.jks`,
  `*.p8`, `*.p12`, `*.key` and `*.pem`.
- **Password fields are masked.** They use `obscureText` in Flutter,
  `secureTextEntry` in React Native and `type="password"` in Electron.

**Not Currently Implemented, but Included in the Design**

1. Real identity Authentication and Authorization. This is so logged-in screens cannot be reached without a valid session. This is included in our design with the simulated login/logout screens and functionality.
2. Biometrics logins that aloow you to sign in with whatever biometric technology is supported by the users device. This is designed for as we have an optional biometric signin screen in our signin workflow.
3. TLS-only API calls to a HIPAA-eligible backend with audit logging. We have included this in our design by selectivly not implementing some functionality as that specific functionality needs to live in the backend (which is out of scope for this prject) in order to be secure.

# Flutter:

## Navigation

First when in the home directory navigate to the main flutter front end using the

```
cd ./care_connect_flutter_frontend
```

## Architecture

```
lib/
├── main.dart            entry point, GoRouter, AppShell (bottom nav + accessibility bar)
├── data.dart            models and in-memory demo data (meds, threads, contacts)
├── action_history.dart  shared undo list (ChangeNotifier)
├── theme.dart           design tokens, light/dark schemes, WCAG contrast helpers, ThemeNotifier
├── widgets.dart         shared widgets (buttons, fields, chips, undo sheet)
└── screens/             one file per screen (13)
```

- **Routing:** `go_router`. The five sign-in routes (`/landing`,
  `/create-account`, `/biometrics`, `/sign-in-bio`, `/sign-in-pass`) sit
  outside the shell. A `ShellRoute` wraps the logged-in routes (`/today`,
  `/medications`, `/schedule`, `/symptoms`, `/messages`,
  `/messages/:threadId`, `/account`, `/calling/:contactId`) in `AppShell`.
- **State:** `provider`. `ThemeNotifier` and `ActionHistory` (undo) are
  provided at the root. Today and Medications both read `slotStatuses` in
  `data.dart`, which keeps dose status in sync between them.
- **Dependencies:** `go_router` 18, `provider` 6 and `google_fonts` 8. It
  needs Dart SDK `^3.13.0` (Flutter 3.44 or newer).

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

The 606 tests above all run on the host and need no device. They break down as
282 widget tests, 241 accessibility tests and 83 unit tests. Two further
layers — integration and end-to-end — need a connected device or emulator and
are described in their own sections below.

## Accessibility Testing

The Flutter app targets **WCAG 2.1 Level AA**. 241 of the 606 host tests are
accessibility tests:

```
flutter test ./test/accessibility
```

| File                             | What it checks                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `a11y_harness.dart`              | Shared harness — mounts all 13 screens at their real routes, in the real shell                                |
| `contrast_test.dart`             | SC 1.4.3 — every painted paragraph, both themes, also at 200% text scale                                      |
| `semantics_test.dart`            | SC 1.1.1, 1.3.1, 4.1.2 — names, roles, headings, tab state, emoji leakage, duplicate names                    |
| `keyboard_and_targets_test.dart` | SC 2.1.1, 2.4.3, 2.4.7 and the 48×48 target size — focusability, Tab order, focus visibility, modal behaviour |
| `text_scaling_test.dart`         | SC 1.4.4 — 100/130/150/200% in both themes, and that text actually grows                                      |
| `status_messages_test.dart`      | SC 4.1.3 — announcements and live regions                                                                     |

One more sits outside that directory: `test/unit/contrast_helpers_test.dart`
sweeps the contrast helpers SC 1.4.3 rests on across all 256 greys, the full
hue wheel and every tint strength. It counts toward the 83 unit tests, not the
241 above.

These assert rather than report: every one fails the build if the app stops
conforming. Each also carries a control, so a check that silently measured
nothing would itself fail — a deliberately low-contrast widget must be caught,
a 20×20 button must fail the target-size guideline, and an emoji-only label
must be rejected.

Flutter's four built-in `AccessibilityGuideline` checks run per screen as
well, but are treated as the floor rather than the ceiling: they accept an
emoji as a label, and their contrast check cannot see text inside a card whose
contents are merged into one spoken sentence. `contrast_test.dart` therefore
enumerates text from the render tree, rasterises the frame, and samples the
colour actually painted around each paragraph.

### Screen-reader testing

A **TalkBack** pass was run on an Android 17 emulator with the screen reader
switched on, covering **11 screens and 154 reachable nodes with 0 unnamed
controls**: Landing, Create account, Face ID setup, Face ID sign-in, Sign in,
Today, Medications, Schedule, Symptoms, Messages and Account. The sign-up
path — Create account and the two Face ID screens — was added by a second
pass; the eight screens the first pass had already covered came back
byte-identical. The transcript is committed at
`care_connect_flutter_frontend/evidence/talkback-transcript.txt` and is
reproduced by:

```
bash tool/talkback_walk.sh
```

Switch TalkBack on first:

```
adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
adb shell settings put secure accessibility_enabled 1
adb shell settings put secure touch_exploration_enabled 1
```

and off again with `adb shell settings delete secure enabled_accessibility_services`.
Touch exploration is the part the walk depends on and it does not always come
up with the service, so confirm `touchExplorationEnabled=true` in
`adb shell dumpsys accessibility` before trusting a run. The script also wants
the Maestro CLI — it looks in `~/.maestro/bin/maestro` and takes a `MAESTRO=`
override — for the one screen described below.

The transcript is captured from the platform accessibility tree — the material
TalkBack composes speech from — because release builds of TalkBack do not log
utterance text. It establishes that every control has a name, a role and the
correct state, and the order they are reached in; it does not establish exact
wording or pacing. Ten screens are read with `uiautomator dump`. Face ID
sign-in is read with `maestro hierarchy` off the same tree, because its
spinner never lets the window go idle and `uiautomator dump` only ever returns
an idle window; the transcript names the reader under that screen.

The pass found one defect, recorded rather than fixed: on Face ID sign-in the
indeterminate spinner reaches the tree as a progress node whose entire
accessible name is `75`, so TalkBack announces a figure that refers to
nothing. The screen remains usable — the `Looking for your face…` line beside
it is what carries the meaning — and the fix is either to keep the indicator
out of semantics or to give it a real label.

**VoiceOver has not been run**: no macOS host or iOS device is available to
this project. Both are covered in full in
`care_connect_flutter_frontend/ACCESSIBILITY.md` §8.

## Integration Testing

40 tests that launch the **real application** — the real router, the real app
shell, the real provider graph — on a device or emulator, at that device's
real size and with real frame timing:

```
flutter test integration_test -d <device-id>
```

Use `flutter devices` to list device IDs.

| File                                | Workflow                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `e2e_harness.dart`                  | Shared — launches the real app, resets seeded state, addresses controls by accessible name  |
| `medication_flow_test.dart`         | Sign in → take a dose → both screens agree → undo from another tab → the missed-dose dialog |
| `symptom_flow_test.dart`            | The symptom logger, including that submit stays inert until a symptom is chosen             |
| `messaging_flow_test.dart`          | Open an unread thread, reply twice, leave and return; the call button                       |
| `navigation_flow_test.dart`         | All six tabs, exactly-one-selected, positional hints, theme persistence, sign out           |
| `accessibility_on_device_test.dart` | Guidelines, control names, the slider's increase action, live regions, 100/130/200% scaling |

The host widget tests mount one screen at a time behind stub routes, so a test
that "navigates" from Today to Medications is really navigating to a stub.
These navigate to the actual screen through the actual shell, so state that
fails to survive the trip actually fails. Every interaction is driven by a
control's accessible name rather than the text drawn on it — the same handle a
screen reader uses, so a labelling regression fails the test rather than
quietly shipping.

## End-to-End (E2E) Testing

Five **Maestro** flows drive the installed APK the way a person would. Maestro
finds elements through Android's `AccessibilityNodeInfo` tree — the same tree
TalkBack reads — so a control with no accessible name is a control the flows
cannot tap.

Maestro is a separate CLI, not part of Flutter — install it from
[maestro.dev](https://maestro.mobile.dev/getting-started/installation) first. Then, from
`care_connect_flutter_frontend/` with a device or emulator running:

```
flutter build apk --debug --dart-define=E2E_SEMANTICS=true
flutter install -d <device-id> --use-application-binary=build/app/outputs/flutter-apk/app-debug.apk
maestro test .maestro --debug-output .maestro/artifacts
```

`flutter devices` lists device IDs. The middle line is `flutter install` and
not `adb install -r` because `adb` is not a command on a machine whose `PATH`
nobody has edited — see [If `adb` or `maestro` is not
found](#if-adb-or-maestro-is-not-found) below, which is the first thing to
check when either of these lines fails.

| Flow                          | Covers                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `01-record-a-dose`            | Sign in → mark a dose taken on Today → the same dose shows taken on Medications                        |
| `02-missed-dose-confirmation` | The confirmation dialog: it names itself, hides the screen behind it, and both cancel and confirm work |
| `03-log-a-symptom`            | The symptom form: expand, choose, grade, submit, and the entry appears                                 |
| `04-message-a-caregiver`      | Open an unread thread, reply, return, and the unread state has cleared                                 |
| `05-screen-reader-names`      | Walks the app asserting every control is named and no name is an emoji                                 |

Two things to know before running them:

- **The `E2E_SEMANTICS` flag is required.** Flutter publishes no accessibility
  tree to Android until something asks for one. A screen reader asks; a UI
  automation tool does not. Without the flag the whole app is a single blank
  `FlutterView` to Maestro.
- **Turn TalkBack off first.** With it on, a single tap only moves
  accessibility focus, so every flow that taps a control fails.

`--debug-output` collects screenshots, the command log and a per-step
hierarchy dump into one directory; that output is git-ignored and
regenerable. See `care_connect_flutter_frontend/.maestro/README.md` for detail.

### If `adb` or `maestro` is not found

Neither tool puts itself on `PATH` on Windows, so both fail with
`The term '...' is not recognized` until you do it yourself.

**`adb`** ships with the Android SDK, which installs it under `platform-tools`
without touching `PATH`. The commands above route around this by installing
through `flutter`, which already located the SDK in order to build — one fewer
thing to configure, at the cost of needing `-d <device-id>` because `flutter`
also offers Chrome, Edge and Windows as targets. (`flutter install` also
uninstalls before installing, clearing app data; `adb install -r` preserves it.
A clean start is what these flows want.) To call `adb` directly instead — the
[Screen-reader testing](#screen-reader-testing) commands and
`tool/talkback_walk.sh` both do, by bare name — put it on `PATH` for the
session:

```powershell
# Windows PowerShell
$env:Path = "$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:Path"
```

```bash
# macOS
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
# Linux
export PATH="$HOME/Android/Sdk/platform-tools:$PATH"
```

**`maestro`** has no such workaround — the flows need the real CLI. Its
installer unpacks to `~/.maestro/bin` and appends that to your shell profile on
macOS and Linux, but the Windows archive edits nothing: `maestro` is
`%USERPROFILE%\.maestro\bin\maestro.bat` and stays invisible until you add it.

```powershell
# this session only
$env:Path = "$env:USERPROFILE\.maestro\bin;$env:Path"

# or for every new session (appends to the user PATH and nothing else —
# `setx PATH` would flatten the machine PATH into it and truncate at 1024 chars)
[Environment]::SetEnvironmentVariable("Path",
  [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.maestro\bin",
  "User")
```

`tool/talkback_walk.sh` resolves Maestro on its own — `~/.maestro/bin/maestro`,
overridable with `MAESTRO=` — so that script needs only the `adb` line.

## Test Coverage Report

`coverage/` is git-ignored, so the generated report is not committed. The
per-file summary is, at `care_connect_flutter_frontend/evidence/coverage-summary.txt`.
Regenerate both with:

```
flutter test --coverage
dart run tool/coverage_summary.dart --out=evidence/coverage-summary.txt
```

`tool/coverage_summary.dart` needs no extra tooling and exits non-zero if line
coverage falls below 75% (`--min=` moves the gate), so the floor is enforced
rather than merely reported. For a browsable HTML report instead,
`genhtml coverage/lcov.info -o coverage/html` still works where `lcov` is
installed; open `coverage/html/index.html` in a browser.

**As of 2026-09-21: 98.90% line coverage (1,795 of 1,815 lines) across 18
files, with 606 tests passing and `flutter analyze` clean.** 11 of the 18
files are at 100% and every other file is above 98% except `lib/main.dart`
at 93.85%, whose uncovered lines are `main()` itself — orientation setup and
`runApp`, which no host test executes and every `integration_test` run does.

## Security Notes

**In place**

- **No persistence.** Medications, dose status, messages and symptom logs live
  in memory only. There is no `shared_preferences`, secure storage, database
  or file I/O, and even the theme choice resets on restart.
- **No app networking.** `lib/` makes no HTTP calls and imports no `dart:io`.
  The release Android manifest declares no permissions at all. `INTERNET` is
  only in the debug and profile manifests, which the Flutter tool needs.
- **No logging and no secrets.** `lib/` contains no `print` or `debugPrint`
  calls, and no API keys.
- **Masked password fields.** They use `obscureText`.

**Known gaps** (prototype limitations)

| Gap                                            | Where                                                                                                            | Production fix                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Sign-in accepts any input; no route guard      | `sign_in_pass_screen.dart` calls `context.go('/today')` without checking anything; `appRouter` has no `redirect` | A real auth service plus a GoRouter `redirect` on the shell              |
| Face ID is a spinner only; no `local_auth`     | `sign_in_bio_screen.dart`                                                                                        | `local_auth`, plus `NSFaceIDUsageDescription` in `ios/Runner/Info.plist` |
| Text fields have no `validator` or `maxLength` | `AuthField` in `widgets.dart`; the message composer                                                              | `Form` with validators; `maxLength` on every free-text field             |

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

- No backend/API integration yet. All data is static and in memory (see `lib/data.dart`).
- Authentication and Face ID are simulated. See Security Notes.
- No CI/CD pipeline. Run `flutter test` and regenerate coverage locally before opening a PR.

# Electron:

## Architecture

```
CareConnectElectron/
├── main.js          main process: creates one BrowserWindow, removes the default menu, F12 opens DevTools
├── preload.js       exposes only getZoom()/setZoom() to the page through contextBridge
├── package.json     npm scripts (start, test, test:jest, test:all, test:coverage); no runtime
│                    dependencies; dev dependencies are Electron 44, Jest, jsdom and c8
├── src/
│   ├── index.html   page shell, Content-Security-Policy, mount points (#app, #modal-root,
│   │                #toast) and the #sr-page screen reader announcer
│   ├── app.js       the entire renderer: data, state, all 13 screens, routing, events,
│   │                keyboard shortcuts, focus management, zoom and the undo history
│   └── styles.css   light/dark themes, the focus indicator, single-column layout for
│                    high zoom, and Windows High Contrast (forced colors) styles
└── tests/
    ├── *.test.cjs   Node test runner suites (npm test), sharing harness.cjs
    └── jest/        Jest suites (npm run test:jest), including business-logic tests
```

- **Process model.** The main process opens the window and removes Electron's
  default menu (except on macOS) so the menu's Ctrl+R and zoom keys do not
  override the app's own shortcuts. The renderer has no access to Node.js.
  The only bridge is `preload.js`, which exposes two zoom functions; there is
  no IPC.
- **Screens.** Each screen is a function that returns HTML. The `SCREENS` map
  in `app.js` registers them, and logged-in screens are wrapped by `shell()`,
  which draws the sidebar navigation and top bar.
- **Navigation.** `go(screen)` pushes onto `state.history`, re-renders, sets
  the window title and announces the page to screen readers. `back()` pops
  the history, and `signOut()` clears it. A single delegated `click`
  listener handles every button through `data-*` attributes.
- **Rendering and focus.** `render()` rebuilds the screen from `state` but
  keeps the scroll position and the focused control. The focus indicator is
  always on one control; arrow keys/WASD move it spatially, mouse movement
  moves it to the hovered control, and Ctrl shortcuts are handled in one
  `keydown` listener (see the Account screen for the full list).
- **Undo history.** Every undoable action is recorded in `actionLog` with a
  function that reverses it. The toast offers Undo right away, Ctrl+U undoes
  the latest action, and the history button in the top bar (Ctrl+H) lists the
  last 50 actions so earlier ones can be undone too.
- **State.** One in-memory `state` object holds the demo data. Only six UI
  preferences persist across restarts, in `localStorage` under a `cc.`
  prefix: theme, sidebar collapsed, zoom, notifications on/off, eye tracking,
  and mouse lock-on.
- **The desktop layout** uses a collapsible sidebar instead of the mobile
  bottom tab bar. The window opens at 1440×900, with a minimum size of
  1024×700.

## Navigation

First, from the repository root, change into the Electron app:

```
cd ./CareConnectElectron
```

## Running the Application

Electron 44 needs **Node.js 22.12 or newer** (`node -v` to check). Install
dependencies the first time, or after `package.json` changes:

```
npm install
```

then start the app with:

```
npm start
```

## Testing the Application

All test commands run from `CareConnectElectron`. Run `npm install` first so
the test tools (`jsdom`, Jest and `c8`) are installed. The tests do not open
a window: they load `src/app.js` into a simulated page (jsdom) and drive it
with clicks and key presses, and they run `main.js` against a fake Electron.

| Command             | What it runs                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run test:all`  | Everything: the Node test runner suite, then the Jest suite         |
| `npm test`          | The Node test runner suite (`tests/*.test.cjs`)                     |
| `npm run test:jest` | The Jest suite (`tests/jest/*.test.js`)                             |

`npm run test:all` stops before Jest if the first suite fails. To run a
single file, pass it directly:

```
node --test tests/keyboard.test.cjs
npx jest tests/jest/business-logic.test.js
```

**What the tests cover**

| File                              | Area                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `main.test.cjs`                   | Window creation and lifecycle on Windows, Linux and macOS, menu removal, F12, the preload zoom bridge |
| `renderer.test.cjs`               | Sign-in, create account, Face ID flow, medications, symptoms, messages, calls, schedule, preferences |
| `keyboard.test.cjs`               | Focus indicator, arrow/WASD navigation, mouse hover and lock-on, every Ctrl shortcut                |
| `zoom.test.cjs`                   | Zoom steps, limits, reset, saved zoom, the Account zoom buttons                                     |
| `undo-history.test.cjs`           | Undo toast, Ctrl+U, the action history panel, "Changed since" entries                               |
| `high-contrast.test.cjs`          | Windows High Contrast (forced colors) styles use system colors for every state                      |
| `screen-reader.test.cjs`          | Accessible names and roles on every screen, announced errors, page announcements, live regions      |
| `jest/business-logic.test.js`     | Rules called directly: progress percentages, validation, undo engine, zoom steps, keyboard rules    |

The other files in `tests/jest/` are Jest versions of the Node test runner
files, so both runners check the same behavior. `tests/harness.cjs` is the
shared setup both suites use.

## Test Coverage Report

```
npm run test:coverage
```

This runs the Node test runner suite under [c8](https://github.com/bcoe/c8)
and measures `main.js` and `src/app.js`. It prints a summary table and fails
if any file drops below **70%** of lines, statements, functions or branches.
The full report is written to `coverage/`:

| File                          | Use                                              |
| ----------------------------- | ------------------------------------------------ |
| `coverage/index.html`         | Open in a browser for a line-by-line report      |
| `coverage/lcov.info`          | For CI tools and editor coverage plugins         |
| `coverage/coverage-summary.json` | Machine-readable totals                       |

`coverage/` is ignored by git. The Jest suite is not included in the report,
because it loads `app.js` into a simulated page rather than importing it.

## Building the Application

The Windows build uses [electron-builder](https://www.electron.build/). It is
not a project dependency, so run it with `npx` from the **repository root**
(not from inside `CareConnectElectron`, where npm would add it to
`package.json`):

```
npx --yes electron-builder@26 --projectDir ./CareConnectElectron --win nsis portable --x64 --config.productName=CareConnect
```

The first build downloads Electron and the installer tools, which takes a few
minutes; later builds take about a minute. The output goes to
`CareConnectElectron/dist/`:

| Output                         | What it is                                                       |
| ------------------------------ | ---------------------------------------------------------------- |
| `CareConnect Setup 1.0.0.exe`  | Installer (about 107 MB). Installs for the current user and adds a Start menu shortcut |
| `CareConnect 1.0.0.exe`        | Portable app. Runs without installing                            |
| `win-unpacked/CareConnect.exe` | The unpacked app, useful for a quick check                       |

`dist/` is not ignored by git, so do not commit it. To put the build
somewhere else, add `--config.directories.output=<folder>`. The version
number comes from `version` in `package.json`.

## Security Notes

The window follows Electron's [security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
for the items that apply to a local-only app:

- **Renderer isolated from Node.js.** `main.js` sets `contextIsolation: true`,
  `nodeIntegration: false` and `sandbox: true`. Even if script were injected
  into the page, it could not read files, spawn processes or reach Electron
  APIs.
- **Content-Security-Policy.** `src/index.html` sets
  `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:`.
  It allows no inline scripts, no `eval` and no remote resources.
  `'unsafe-inline'` applies to styles only, because screens use inline
  `style=` attributes.
- **Local content only.** The window loads `src/index.html` with `loadFile`.
  No remote URL is ever loaded, and the app contains no external links.
- **Escaping user input.** Screens are built as HTML strings, so every
  user-entered value (symptom notes, messages, name, initials, email) passes
  through `esc()`, which escapes `& < > " '` before it reaches `innerHTML`.
  Toast messages are set with `textContent`.
- **No IPC, no secrets, no logging.** There is no `ipcMain` or `ipcRenderer`,
  no API keys, and no `console.*` calls. The one preload script uses
  `contextBridge` to expose only `getZoom()` and `setZoom()`, and `setZoom`
  ignores anything that isn't a number from 0.25 to 5.
- **Health data is never written to disk.** Only the six UI preferences
  above go to `localStorage`. Medications, symptoms, messages and the undo
  history stay in memory and are cleared on sign-out or restart.

**Known gaps** (prototype limitations)

| Gap                                                   | Where                                                      | Production fix                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Sign-in accepts any password; Face ID is a timer      | `app.js` submit handler; `facescan` → `facesuccess` timers | A real auth service; Windows Hello / Touch ID through the main process |
| Sign-in form pre-fills `value="password"`             | `app.js` `signin` screen                                   | Remove the demo value                                                  |

## Known Limitations

- **Demo data only.** Medications, symptoms, messages and appointments are
  sample data held in memory. Changes are lost on sign-out or restart, and
  nothing is sent to a care team. The schedule always shows the week of
  September 28, 2026.
- **Simulated features.** Sign-in accepts any password, Face ID is a timed
  animation, and calls, SOS alerts, voice commands and eye tracking only
  change what is shown on screen. Mouse lock-on and zoom are fully working.
- **Undo history** keeps the 50 most recent actions for the current session
  and is cleared on sign-out. An SOS alert cannot be undone.
- **Keyboard shortcuts** use the Ctrl key on every platform, including macOS
  (not Cmd). Shortcuts held with Alt (AltGr on some keyboard layouts) are
  ignored, and Ctrl+\\ needs a layout with a `\` key.
- **Zoom** ranges from 80% to 200%. At high zoom the layout switches to a
  single column.
- **Unsigned builds.** The Windows installer is not code-signed, so Windows
  SmartScreen warns before it runs. There is no auto-update and no macOS or
  Linux build command.
- **Accessibility testing.** Screen reader support was verified against
  Chromium's accessibility tree, and High Contrast against Chromium's
  forced-colors emulation, not with every screen reader and Windows theme.
  The automated tests cannot press Enter to activate a button (the browser
  does that natively), so that is checked by hand.

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| `npm start` fails or Electron will not install | Check `node -v` is 22.12 or newer, then run `npm install` again. |
| `npm test` says `Cannot find module 'jsdom'` (or `jest`, `c8`) | Run `npm install` in `CareConnectElectron`. |
| `npm run test:coverage` fails with a coverage error | A file fell below 70%. The table names the file; add tests for the uncovered lines shown in `coverage/index.html`. |
| The build stops with `Package "electron-builder" is only allowed in "devDependencies"` | `npx` was run inside `CareConnectElectron` and saved electron-builder to `package.json`. Undo that with `git checkout -- package.json package-lock.json`, run `npm prune`, then run the build command from the repository root. |
| The build stops with `Cannot create symbolic link` | Turn on Windows Developer Mode (Settings → For developers) or run the terminal as administrator, then build again. |
| Windows shows "Windows protected your PC" when opening the installer | The build is unsigned. Choose **More info → Run anyway**. |
| Keyboard shortcuts do nothing | Click inside the CareConnect window first. Undo, history, SOS, biometric and notification shortcuts only work after signing in, and most are paused while a dialog is open (press Esc). |
| Arrow keys do not move the focus indicator while a screen reader is on | NVDA and JAWS use arrow keys to read the page. Use Tab, or switch the screen reader to focus mode (NVDA+Space). |
| The app opens zoomed in or with old settings | Press Ctrl+0 to reset zoom. To clear every saved preference, press F12, open the Console and run `localStorage.clear(); location.reload()`. |
| Checking Windows High Contrast | Press Left Alt + Left Shift + Print Screen to turn it on or off. |

# React:

The React front end is an [Expo](https://docs.expo.dev/) / React Native application written in TypeScript. The same codebase runs on Android, iOS, and the web.

## Navigation

First when in the home directory navigate to the main react front end using the

```
cd ./CareConnectReact
```

## Architecture

```
index.ts / App.tsx      entry point; NavigationContainer + native-stack navigator
src/
├── screens/            one file per screen (13)
├── components/         AuthComponents, AppComponents, AppShell (tabs + accessibility bar)
├── context/            ThemeContext (light/dark), ScrollContext (scroll-button bridge)
├── hooks/              useUndoHistory (undo any action in any order), useAnimatedValue
└── constants/          data.ts (static demo data), theme.ts (design tokens)
```

- **Navigation:** `@react-navigation/native-stack` covers the sign-in flow
  (Landing, CreateAccount, BiometricsIntro, FaceID, SignIn, Today). After
  sign-in, `AppShell.tsx` switches between the six tabs, a message thread and
  a call with local state rather than a second navigator. That is why the
  thread and call screens can hide the tab bar.
- **State:** React state and context only. There is no Redux and no
  persistence.
- **Key libraries:** Expo SDK 57, React Native 0.86, React 19.2,
  React Navigation 7, `react-native-web` for the browser build, and
  `expo-dev-client` (so `expo run:*` produces a development client, not an
  Expo Go build).

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

For a distributable release build (for example a standalone APK or AAB) use EAS Build. There is no `eas.json` in the repository yet, so it has to be configured once before the first build:

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

### Note 1. These tests include accessibility and integration tests for the React CareConnect application.

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

## Maestro

In order to test through the maestro flows make sure an emulator is currently running the application then run

```
maestro test .maestro
```

An emulator is always require with Maestro and you must either use an emulator or a physical device running the application there are currently 8 maestro test flows that run through the react application. There are 8 maestro flows which recreate 8 user flows through the react application as seen below:

1. Sign in → Today — password login shows the dashboard + all tabs.
2. Create account + Face ID — sign up, opt into Face ID, land on Today.
3. Face ID sign-in — alternate login path, same Today landing.
4. Tab navigation — every bottom tab opens its screen.
5. Message quick reply — open a thread, send a canned reply, go back.
6. Calling — call from a thread, connects, then end call.
7. Theme + sign out — toggle dark mode, sign out to Landing.
8. Take/undo medication — mark a dose taken, undo it.

## Screen Reader Testing

TalkBack was used as a screen reader as well for the React CareConnect Version of the application an emulator of an android phone was used to run the application and Talkback was enabled using

```
adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService
adb shell settings put secure accessibility_enabled 1
adb shell settings put secure touch_exploration_enabled 1
```

The application was then ran through manually using the screen reader to ensure accuracy and each Item that was interactable was able to be read by the screen reader.

## Accessibility

Accessibility is a major focus of this application in many ways with this version of CareConnect itself being catered specifically towards people experiencing a parkinsonian tremor. Examples of how the application is accessible include:

- The ability to sign in with a biometric marker
- The ability to change the view of the screen using light/dark mode
- The ability to easily undo immediate actions
- The ability to easily undo any action in any order
- The larger button size making it easier for our user demographic to select
- The larger text making things easier to see
- The adaptable layouts making the application available and usable on most devices and configurations
- The adaptive UI elements making the application available and usable on most devices and configurations
- The scroll buttons allowing the user to scroll up and down when they can.
- The voice command feature allowing the user to navigate and select UI elements with their voice (planned in the UI does not exist currently as there's no backend)
- Carefully labeled so the application is screen reader accessible

## Security Notes

**In place**

- **No persistence.** No AsyncStorage, SecureStore or `localStorage`. All
  health data is static (`src/constants/data.ts`) or in component state, and
  is gone when the app closes.
- **No networking.** There are no `fetch`, axios or WebSocket calls, and no
  backend URLs.
- **No HTML injection surface.** There is no `WebView` and no
  `dangerouslySetInnerHTML`. All text, including user-typed messages, renders
  through React Native `<Text>`, which escapes content on native and web.
- **Masked password field.** `AuthField` uses `secureTextEntry` with
  `autoCorrect={false}` and `autoCapitalize="none"`, so passwords never enter
  the keyboard's learned-words dictionary.
- **No secrets and no logging.** There are no API keys or `EXPO_PUBLIC_*`
  variables, and no `console.*` calls in `src/`. `.gitignore` excludes
  signing keys (`*.jks`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision`) and
  the generated `android/` and `ios/` folders.

**Known gaps** (prototype limitations)

| Gap                                                                          | Where                                                                         | Production fix                                                                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Sign-in and create-account do no validation; any input (even empty) signs in | `SignInScreen.tsx` and `CreateAccountScreen.tsx` navigate directly to `Today` | A real auth service plus an auth-gated navigator                                                           |
| Face ID is a 2-second timer                                                  | `FaceIDScreen.tsx`                                                            | `expo-local-authentication`, plus `NSFaceIDUsageDescription` via the `ios.infoPlist` setting in `app.json` |
| No `maxLength` on text inputs                                                | Message composer in `MsgThreadScreen.tsx`; `AuthField`                        | Length limits and email-format validation                                                                  |
| No session timeout                                                           | —                                                                             | An `AppState` listener that locks after inactivity                                                         |

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

ESLint's React Compiler rules reject the older `useRef(new Animated.Value(0)).current` idiom with `Cannot access refs during render`. Use the project's own `useAnimatedValue()` from `src/hooks/useAnimatedValue.ts` instead.

Import it from there and **not** from `react-native`. React Native exports a hook of the same name, but `react-native-web` does not re-export it, so the `react-native` import type-checks, passes the Jest suite, and bundles without complaint — then throws `useAnimatedValue is not a function` the moment the screen renders in a browser. `eslint.config.js` has a `no-restricted-imports` rule that fails the lint if anyone imports it from `react-native` again.

The test output contains `SafeAreaView has been deprecated` warnings from React Native. These are noise from the current component implementation and do not fail the suite.

Maestro can have issues specifically test 6 which uses the call button can have issues when certain emulators put icons over the call button other tests can also have issues when that same settings button goes over the light/dark mode button when those items are moved or are not there the maestro tests work perfectly so adjust that icon from the emulator accordingly. Note that icon is a byproduct of certain emulators and not the android OS itself.

## Known Issues / Limitations

- No backend/API integration yet. All data is static/in-memory (see `src/constants/data.ts`).
- Authentication and Face ID are simulated. See Security Notes.
- No CI/CD pipeline. Run `npm run test:ci` and regenerate coverage locally before opening a PR.
- No EAS build profile is committed, so release builds require a one-time `eas build:configure`.
- Some packages are deprecated or will be soon. The application still builds, but with warnings.

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

# Weekly Contributions 09/16-09/22

## Daniel

- Worked on the Read Me
- Added Accessibility testing and other forms of testing to the React Application
- Tested the react application using the Talkback screen reader
- Created and worked on the Test Coverage as well as the Accessibility/Screen Reader document
- Added End to End testing for the React Application
- Enhanced apects of the code to meet WCAG 2.1 Level AA Compliance

## Justin

- Worked on the README
- Added Accessibility testing for the Flutter application
- Enhanced apects of the code to meet WCAG 2.1 Level AA Compliance
- Added Integration testing for the Flutter application
- Added End to End testing for the Flutter application

## Ian

- Wrote Accessibility Report using VPAT (2.5Ver)
- Noted additional requirements for WCAG 2.1 Level AA Compliance required for future weeks; not all requirements are met at current week
- Ensured access to Github for future development purposes
- Reviewed codebase to ensure full familiarity in advance of future code changes and additional requirements

# Weekly Contributions 09/30-10/06

## Daniel

-

## Justin

- Worked on the README
- Added an architecture overview and security overview covering all three applications (Flutter, React Native, and Electron)
- Documented build instructions and security notes for each application, including release builds for Flutter and a new Electron section
- Tested the Electron application's desktop accessibility: keyboard-only navigation, visible focus indicators, the NVDA screen reader, and Windows high contrast mode
- Recorded the desktop accessibility video demonstrating keyboard navigation and screen reader usage

## Ian

-

### AI Disclosure: The code and parts of the README files in this project were written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code and files have been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
