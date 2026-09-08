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

### Flutter:
WARNING for certain parts of running this application you may need to build with plugins in this case windows may yell at you because it limits the symlinks flutter typically uses to administrators by default to ensure that a smooth experience is had by all use 
```
start ms-settings:developers
```
This will bring you to the developer settings in windows and allow you to turn them on and off with a toggle. Ensure developer settings are turned on if you are using windows

After cloning the repository down into your working directory move into the care_connect_flutter_frontend directory
```
cd ./care_connect_flutter_frontend
```
now that you are in the main flutter frontend directory there are a large amount of operations that could be performed if you wanted to simply run the application
```
flutter run
```
then selecting which mode is appropriate for you. Typically #2 Google Chrome is the recommended option.

If you want to build an application you can use the commands 
```
flutter build apk
```
to build an android apk of the CareConnect application. To build an IOS version of the application use
```
flutter build ios
```
When it comes to testing the application there are multiple ways to test the application. While in the care_connect_flutter_frontend directory you can run the full test suite with 
```
flutter test
```
You can run the unit tests using 
```
flutter test ./test/unit
```
and the widget tests using 
```
flutter test ./test/uwidget
```
to run tests on a specific file you would use 
```
flutter test <path to file>
```

### Electron:
<TODO>

### React:
<TODO>

### AI Disclosure: The code in this project was written with the help of Figma Make, Claude Opus 5, and Claude Sonnet 5 many of the screens were adapted from screens written with Figma Make and Claude Opus 5 as well with Figma and Claude working to translate the screens into code which was then edited and check by the Team in order to better reflect the project. The code has been subject to changes by Team 7 and all content is to be reviewed by Team 7 before submission.
