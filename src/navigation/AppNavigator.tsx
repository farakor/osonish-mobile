import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Импортируем экраны
import { SplashScreen } from '../screens/shared/SplashScreen';
import {
  AuthScreen,
  LoginScreen,
  LoginSmsVerificationScreen,
  RegistrationScreen,
  SmsVerificationScreen,
  ProfileInfoStepByStepScreen,
  RoleSelectionScreen,
  CitySelectionScreen
} from '../screens/auth';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { WorkerStackNavigator } from './WorkerStackNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="LoginSmsVerification"
          component={LoginSmsVerificationScreen}
        />
        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
        />
        <Stack.Screen
          name="SmsVerification"
          component={SmsVerificationScreen}
        />
        <Stack.Screen
          name="ProfileInfo"
          component={ProfileInfoStepByStepScreen}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
        />
        <Stack.Screen
          name="CitySelection"
          component={CitySelectionScreen}
        />
        <Stack.Screen
          name="CustomerTabs"
          component={CustomerStackNavigator}
        />
        <Stack.Screen
          name="WorkerTabs"
          component={WorkerStackNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
