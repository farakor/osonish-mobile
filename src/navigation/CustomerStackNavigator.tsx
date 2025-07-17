import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { OrderDetailsScreen, EditProfileScreen, NotificationsScreen, SupportScreen } from '../screens/customer';

export type CustomerStackParamList = {
  MainTabs: undefined;
  OrderDetails: { orderId: string };
  EditProfile: undefined;
  Notifications: undefined;
  Support: undefined;
};

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