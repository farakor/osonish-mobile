import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { OrderDetailsScreen } from '../screens/customer';

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  OrderDetails: { orderId: string };
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
        name="CustomerTabs"
        component={CustomerTabNavigator}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
} 