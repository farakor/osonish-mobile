import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import type { CustomerTabParamList } from '../types';
import {
  CustomerHomeScreen,
  CreateOrderStepByStepScreen,
  MyOrdersScreen,
  CustomerProfileScreen
} from '../screens/customer';
import HomeIcon from '../../assets/home-02.svg';
import CreateOrderIcon from '../../assets/file-plus-03.svg';
import MyOrdersIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

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
          paddingTop: theme.spacing.sm, // уменьшен верхний паддинг
          paddingBottom: theme.spacing.xxl, // увеличен нижний паддинг
          height: 99, // уменьшена высота меню на 10% (было 110)
          justifyContent: 'center', // центрирование по вертикали
        },
        tabBarLabelStyle: {
          fontSize: theme.fonts.sizes.sm, // уменьшен размер шрифта
          fontWeight: theme.fonts.weights.medium, // обычный вес
          marginBottom: 0, // убираем отступ снизу
          marginTop: theme.spacing.xs, // добавляем отступ сверху
        },
        tabBarIconStyle: {
          marginBottom: 0, // убираем отступ снизу у иконки
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={CustomerHomeScreen}
        options={{
          tabBarLabel: 'Главная',
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
        name="CreateOrder"
        component={CreateOrderStepByStepScreen}
        options={{
          tabBarLabel: 'Создать',
          tabBarIcon: ({ color, size, focused }) => (
            <CreateOrderIcon
              width={25}
              height={25}
              fill={focused ? `${color}1F` : `${theme.colors.text.secondary}1F`}
              stroke={focused ? color : theme.colors.text.secondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: 'Мои заказы',
          tabBarIcon: ({ color, size, focused }) => (
            <MyOrdersIcon
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
        component={CustomerProfileScreen}
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