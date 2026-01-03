// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen.tsx';
import LoginScreen from '../screens/LoginScreen.tsx';
import DriverMain from '../screens/DriverMain.tsx';
import ExpertLogin from '../screens/ExpertLogin.tsx';
import ExpertRegister from '../screens/ExpertRegister.tsx';
import OTPAuthScreen from '../screens/OTPAuth.tsx'; // Import the OTP screen
import FirestoreTest from '../screens/FirestoreTest.tsx';
import ExpertProfile from '../screens/ExpertProfile.tsx';
import ChangePassword from '../screens/ChangePassword.tsx';
import ForgotPasswordStep1 from '../screens/ForgotPasswordStep1.tsx';
import ForgotPasswordStep2 from '../screens/ForgotPasswordStep2.tsx';



export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  DriverMain: undefined;
  ExpertLogin: undefined;
  ExpertRegister: undefined;
  OTPAuth: undefined;
  ForgotPasswordStep1: undefined;
  ForgotPasswordStep2: undefined;
  ChangePassword: undefined;
  ExpertProfile: undefined;
  FirestoreTest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DriverMain" component={DriverMain} />
        <Stack.Screen name="ExpertLogin" component={ExpertLogin} />
        <Stack.Screen name="ForgotPasswordStep1" component={ForgotPasswordStep1} />
        <Stack.Screen name="ForgotPasswordStep2" component={ForgotPasswordStep2} />
        <Stack.Screen name="ExpertRegister" component={ExpertRegister} />
        <Stack.Screen name="ExpertProfile" component={ExpertProfile} />
        <Stack.Screen
          name="OTPAuth"
          component={OTPAuthScreen}
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="FirestoreTest" component={FirestoreTest} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
