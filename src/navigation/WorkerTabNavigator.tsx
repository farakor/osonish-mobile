import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { WorkerTabParamList } from '../types';
import { theme } from '../constants/theme';

// Импортируем экраны исполнителя
import {
  WorkerJobsScreen,
  WorkerCategoriesScreen,
  WorkerApplicationsScreen,
  WorkerProfileScreen,
} from '../screens/worker';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

export function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={WorkerJobsScreen}
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="💼" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={WorkerCategoriesScreen}
        options={{
          title: 'Категории',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📋" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Applications"
        component={WorkerApplicationsScreen}
        options={{
          title: 'Заявки',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📝" color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WorkerProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="👤" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Компонент иконки таба
const TabIcon = ({ icon, color }: { icon: string; color: string }) => (
  <Text style={{ fontSize: 20, color }}>
    {icon}
  </Text>
); 