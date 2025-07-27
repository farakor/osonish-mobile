import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import type { WorkerTabParamList } from '../types';
import {
  WorkerJobsScreen,
  WorkerApplicationsScreen,
  WorkerProfileScreen,
} from '../screens/worker';
import HomeIcon from '../../assets/home-02.svg';
import FileIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

export function WorkerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
          paddingTop: theme.spacing.sm, // уменьшен верхний паддинг
          paddingBottom: theme.spacing.xxl, // увеличен нижний паддинг
          height: 99, // уменьшена высота меню на 10% (было 110)
          justifyContent: 'center', // центрирование по вертикали
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.sm, // уменьшен размер шрифта
          fontWeight: theme.typography.fontWeight.medium, // обычный вес
          marginBottom: 0, // убираем отступ снизу
          marginTop: theme.spacing.xs, // добавляем отступ сверху
        },
        tabBarIconStyle: {
          marginBottom: 0, // убираем отступ снизу у иконки
        },
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={WorkerJobsScreen}
        options={{
          tabBarLabel: 'Заказы',
          tabBarIcon: ({ color, size, focused }) => (
            <HomeIcon
              width={25}
              height={25}
              fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
              stroke={focused ? color : theme.colors.text.secondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Applications"
        component={WorkerApplicationsScreen}
        options={{
          tabBarLabel: 'История',
          tabBarIcon: ({ color, size, focused }) => (
            <FileIcon
              width={25}
              height={25}
              fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
              stroke={focused ? color : theme.colors.text.secondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Профиль',
          tabBarIcon: ({ color, size, focused }) => (
            <ProfileIcon
              width={25}
              height={25}
              fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
              stroke={focused ? color : theme.colors.text.secondary}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 