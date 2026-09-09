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

and select which type of application you wish to build.

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
<TODO>

# Weekly Contributions 09/02-09/08
## Daniel
- Worked to build out majority of the testing Suite
- Designed the landing, create account, sign in screens, and biometric face id screens
- Contributed alot of comments 
- Worked on the README
- Took the screenshots in the screenshots document
- Built the application

## Justin
<TODO>

## Ashvini
- Designed the Schedule, Symptoms, Account and calling screens
- Reviewed the screenshot document and made adjustments
- Tested the app

### AI Disclosure: The code in this project was written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code has been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
