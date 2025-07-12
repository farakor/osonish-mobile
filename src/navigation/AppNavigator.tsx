import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Импортируем экраны
import { SplashScreen } from '../screens/shared/SplashScreen';
import { AuthScreen, RegistrationScreen, SmsVerificationScreen, RoleSelectionScreen } from '../screens/auth';

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
          name="Registration"
          component={RegistrationScreen}
        />
        <Stack.Screen
          name="SmsVerification"
          component={SmsVerificationScreen}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
