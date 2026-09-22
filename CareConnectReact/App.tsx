import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppShellNavigator from '@/components/AppShell';
import { ThemeProvider } from '@/context/ThemeContext';
import BiometricsIntroScreen from '@/screens/BiometricsIntroScreen';
import CreateAccountScreen from '@/screens/CreateAccountScreen';
import FaceIDScreen from '@/screens/FaceIDScreen';
import LandingScreen from '@/screens/LandingScreen';
import SignInScreen from '@/screens/SignInScreen';

export type RootStackParamList = {
  Landing: undefined;
  CreateAccount: undefined;
  BiometricsIntro: undefined;
  FaceID: undefined;
  SignIn: undefined;
  Today: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="BiometricsIntro" component={BiometricsIntroScreen} />
          <Stack.Screen name="FaceID" component={FaceIDScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Today" component={AppShellNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
