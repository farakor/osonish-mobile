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
  WorkerTypeSelectionScreen,
  SpecializationSelectionScreen,
  ProfessionalAboutMeScreen,
  JobSeekerInfoScreen,
  JobSeekerInfoStepByStepScreen,
  CitySelectionScreen,
  LoadingScreen,
  LanguageSelectionScreen
} from '../screens/auth';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { WorkerStackNavigator } from './WorkerStackNavigator';
import { DocumentWebViewScreen } from '../screens/shared';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: '#679B00',
          background: '#F4F5FC', // Светло-синий фон для всего приложения
          card: '#F4F5FC',
          text: '#000000',
          border: '#E5E5EA',
          notification: '#FF3B30',
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F4F5FC' }, // Светло-синий фон для экранов
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
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
          name="WorkerTypeSelection"
          component={WorkerTypeSelectionScreen}
        />
        <Stack.Screen
          name="SpecializationSelection"
          component={SpecializationSelectionScreen}
        />
        <Stack.Screen
          name="ProfessionalAboutMe"
          component={ProfessionalAboutMeScreen}
        />
        <Stack.Screen
          name="JobSeekerInfo"
          component={JobSeekerInfoScreen}
        />
        <Stack.Screen
          name="JobSeekerInfoStepByStep"
          component={JobSeekerInfoStepByStepScreen}
        />
        <Stack.Screen
          name="CitySelection"
          component={CitySelectionScreen}
        />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
        />
        <Stack.Screen
          name="CustomerTabs"
          component={CustomerStackNavigator}
        />
        <Stack.Screen
          name="WorkerTabs"
          component={WorkerStackNavigator}
        />
        <Stack.Screen
          name="DocumentWebView"
          component={DocumentWebViewScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
