import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkerTabNavigator } from './WorkerTabNavigator';
import { EditProfileScreen, NotificationsScreen, SupportScreen } from '../screens/worker';

export type WorkerStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Support: undefined;
};

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function WorkerStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={WorkerTabNavigator}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
} 