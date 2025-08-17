import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../types/navigation';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { OrderDetailsScreen, EditOrderScreen, EditProfileScreen, NotificationsScreen, NotificationsListScreen, SupportScreen, ApplicantsListScreen, RatingScreen, WorkerProfileScreen } from '../screens/customer';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={CustomerTabNavigator}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditOrder"
        component={EditOrderScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ApplicantsList"
        component={ApplicantsListScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          presentation: 'card',
        }}
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
        name="NotificationsList"
        component={NotificationsListScreen}
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
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
} 