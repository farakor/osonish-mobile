import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import type { WorkerTabParamList } from '../types';
import {
  WorkerJobsScreen,
  WorkerApplicationsScreen,
  WorkerProfileScreen,
} from '../screens/worker';
import {
  AnimatedTabIcon,
  AnimatedTabLabel,
  AnimatedTabIndicator,
  withAnimatedTabScreen,
} from '../components/common';
import HomeIcon from '../../assets/home-02.svg';
import FileIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

// Создаем анимированные версии экранов
const AnimatedWorkerJobsScreen = withAnimatedTabScreen(WorkerJobsScreen);
const AnimatedWorkerApplicationsScreen = withAnimatedTabScreen(WorkerApplicationsScreen);
const AnimatedWorkerProfileScreen = withAnimatedTabScreen(WorkerProfileScreen);

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
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.xxl,
          height: 99,
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: theme.fonts.sizes.sm,
          fontWeight: theme.fonts.weights.medium,
          marginBottom: 0,
          marginTop: theme.spacing.xs,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={AnimatedWorkerJobsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                Заказы
              </Text>
            </AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <HomeIcon
                width={25}
                height={25}
                fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
                stroke={focused ? color : theme.colors.text.secondary}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Applications"
        component={AnimatedWorkerApplicationsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                Мои заказы
              </Text>
            </AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <FileIcon
                width={25}
                height={25}
                fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
                stroke={focused ? color : theme.colors.text.secondary}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AnimatedWorkerProfileScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                Профиль
              </Text>
            </AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <ProfileIcon
                width={25}
                height={25}
                fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
                stroke={focused ? color : theme.colors.text.secondary}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
} 