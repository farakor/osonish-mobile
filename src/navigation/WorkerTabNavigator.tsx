import React from 'react';
import { Text, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import { usePlatformSafeAreaInsets, getBottomTabBarStyle } from '../utils/safeAreaUtils';
import { useNavigationTranslation } from '../hooks/useTranslation';
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
  const insets = usePlatformSafeAreaInsets();
  const tabBarStyle = getBottomTabBarStyle(insets);
  const t = useNavigationTranslation();

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
          justifyContent: 'center',
          ...tabBarStyle, // Применяем стили с учетом платформы в конце
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
        // Отключаем ripple эффект на Android
        tabBarButton: Platform.OS === 'android' ? (props: any) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.8}
            style={[props.style, { overflow: 'hidden' }]}
          />
        ) : undefined,
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={AnimatedWorkerJobsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                {t('jobs')}
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
                {t('applications')}
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
                {t('profile')}
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