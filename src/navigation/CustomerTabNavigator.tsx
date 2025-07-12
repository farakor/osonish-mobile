import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { theme } from '../constants';
import type { CustomerTabParamList } from '../types';

// Импортируем экраны покупателя
import {
  CustomerHomeScreen,
  CreateOrderScreen,
  MyOrdersScreen,
  CustomerProfileScreen
} from '../screens/customer';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingVertical: theme.spacing.xs,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          marginBottom: theme.spacing.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={{
          tabBarLabel: 'Создать заказ',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: 'Мои заказы',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={CustomerProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
} 