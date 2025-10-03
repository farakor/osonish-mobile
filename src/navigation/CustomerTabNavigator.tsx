import React from 'react';
import { Text, Platform, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import { noElevationStyles } from '../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getBottomTabBarStyle } from '../utils/safeAreaUtils';
import { useNavigationTranslation } from '../hooks/useTranslation';
import type { CustomerTabParamList } from '../types';
import {
  CustomerHomeScreen,
  CreateOrderStepByStepScreen,
  MyOrdersScreen,
  CustomerProfileScreen,
  CategoriesScreen
} from '../screens/customer';
import {
  AnimatedTabIcon,
  withAnimatedTabScreen,
} from '../components/common';
import HomeIcon from '../../assets/home-02.svg';
import CategoryIcon from '../../assets/card-icons/category.svg';
import MyOrdersIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';
import PlusSquareIcon from '../../assets/plus-square.svg';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// Создаем анимированные версии экранов
const AnimatedCustomerHomeScreen = withAnimatedTabScreen(CustomerHomeScreen);
const AnimatedCategoriesScreen = withAnimatedTabScreen(CategoriesScreen);
// Убираем анимированную обертку для экрана создания заказа, так как у него есть собственные анимации
const AnimatedCreateOrderScreen = CreateOrderStepByStepScreen;
const AnimatedMyOrdersScreen = withAnimatedTabScreen(MyOrdersScreen);
const AnimatedCustomerProfileScreen = withAnimatedTabScreen(CustomerProfileScreen);

export function CustomerTabNavigator() {
  const insets = usePlatformSafeAreaInsets();
  const tabBarStyle = getBottomTabBarStyle(insets);
  const t = useNavigationTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#1a1a1a',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          // Легкая тень для меню бара
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
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
        name="Home"
        component={AnimatedCustomerHomeScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color,
              fontSize: 11,
              fontWeight: theme.fonts.weights.medium
            }}>
              {t('home')}
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <HomeIcon
                width={25}
                height={25}
                color={focused ? color : '#1a1a1a'}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={AnimatedCategoriesScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color,
              fontSize: 11,
              fontWeight: theme.fonts.weights.medium
            }}>
              Категории
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <CategoryIcon
                width={25}
                height={25}
                color={focused ? color : '#1a1a1a'}
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
            <Text style={{
              color: focused ? theme.colors.primary : '#1a1a1a',
              fontSize: 11,
              fontWeight: theme.fonts.weights.medium,
              marginTop: 10
            }}>
              Создать
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <PlusSquareIcon width={24} height={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyOrders"
        component={AnimatedMyOrdersScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              color,
              fontSize: 11,
              fontWeight: theme.fonts.weights.medium
            }}>
              {t('my_orders')}
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <MyOrdersIcon
                width={25}
                height={25}
                color={focused ? color : '#1a1a1a'}
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
            <Text style={{
              color,
              fontSize: 11,
              fontWeight: theme.fonts.weights.medium
            }}>
              {t('profile')}
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <ProfileIcon
                width={25}
                height={25}
                color={focused ? color : '#1a1a1a'}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
} 