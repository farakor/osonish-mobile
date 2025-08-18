import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import type { CustomerTabParamList } from '../types';
import {
  CustomerHomeScreen,
  CreateOrderStepByStepScreen,
  MyOrdersScreen,
  CustomerProfileScreen
} from '../screens/customer';
import {
  AnimatedTabIcon,
  AnimatedTabLabel,
  AnimatedTabIndicator,
  withAnimatedTabScreen,
} from '../components/common';
import HomeIcon from '../../assets/home-02.svg';
import CreateOrderIcon from '../../assets/file-plus-03.svg';
import MyOrdersIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// Создаем анимированные версии экранов
const AnimatedCustomerHomeScreen = withAnimatedTabScreen(CustomerHomeScreen);
const AnimatedCreateOrderScreen = withAnimatedTabScreen(CreateOrderStepByStepScreen);
const AnimatedMyOrdersScreen = withAnimatedTabScreen(MyOrdersScreen);
const AnimatedCustomerProfileScreen = withAnimatedTabScreen(CustomerProfileScreen);

export function CustomerTabNavigator() {
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
        // Добавляем анимацию переходов между экранами
        animationEnabled: true,
        animationTypeForReplace: 'push',
      }}
    >
      <Tab.Screen
        name="Home"
        component={AnimatedCustomerHomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                Главная
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
        name="CreateOrder"
        component={AnimatedCreateOrderScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <AnimatedTabLabel focused={focused} color={color}>
              <Text style={{ color, fontSize: theme.fonts.sizes.sm, fontWeight: theme.fonts.weights.medium }}>
                Создать
              </Text>
            </AnimatedTabLabel>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <CreateOrderIcon
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
        name="MyOrders"
        component={AnimatedMyOrdersScreen}
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
              <MyOrdersIcon
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
        component={AnimatedCustomerProfileScreen}
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