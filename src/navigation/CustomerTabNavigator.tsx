import React, { useState, useEffect } from 'react';
import { Text, Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../constants';
import { noElevationStyles } from '../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getBottomTabBarStyle } from '../utils/safeAreaUtils';
import { useNavigationTranslation } from '../hooks/useTranslation';
import type { CustomerTabParamList, RootStackParamList } from '../types';
import {
  CustomerHomeScreen,
  MyOrdersScreen,
  CustomerProfileScreen,
  CategoriesScreen
} from '../screens/customer';
import {
  AnimatedTabIcon,
  withAnimatedTabScreen,
} from '../components/common';
import { FloatingTabBar } from '../components/navigation';
import { AuthRequiredModal } from '../components/auth/AuthRequiredModal';
import { authService } from '../services/authService';
import HomeIcon from '../../assets/home-02.svg';
import CategoryIcon from '../../assets/card-icons/category.svg';
import MyOrdersIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// Создаем анимированные версии экранов
const AnimatedCustomerHomeScreen = withAnimatedTabScreen(CustomerHomeScreen);
const AnimatedCategoriesScreen = withAnimatedTabScreen(CategoriesScreen);
const AnimatedMyOrdersScreen = withAnimatedTabScreen(MyOrdersScreen);
const AnimatedCustomerProfileScreen = withAnimatedTabScreen(CustomerProfileScreen);

export function CustomerTabNavigator() {
  const insets = usePlatformSafeAreaInsets();
  const tabBarStyle = getBottomTabBarStyle(insets);
  const t = useNavigationTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = (): boolean => {
    const authState = authService.getAuthState();
    return authState.isAuthenticated && !!authState.user;
  };

  // Отслеживаем изменения авторизации
  useEffect(() => {
    const updateAuthState = () => {
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);
    };

    // Проверяем при монтировании
    updateAuthState();

    // Проверяем каждые 500ms для отслеживания изменений
    const interval = setInterval(updateAuthState, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAuthModalClose = () => {
    setIsAuthModalVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => <View style={{ flex: 1 }} />,
          // Светло-синий фон для всех экранов табов
          sceneStyle: { backgroundColor: '#F4F5FC' },
        }}
        tabBar={(props) => (
          <FloatingTabBar>
            {props.state.routes
              .filter((route) => {
                // Скрываем "Мои заказы" для неавторизованных пользователей
                if (route.name === 'MyOrders' && !isAuthenticated) {
                  return false;
                }
                return true;
              })
              .map((route, index) => {
                const { options } = props.descriptors[route.key];
                const actualIndex = props.state.routes.indexOf(route);
                const isFocused = props.state.index === actualIndex;

                const onPress = () => {
                  // Проверяем, если это таб "Profile" и пользователь не авторизован
                  if (route.name === 'Profile' && !checkAuth()) {
                    console.log('[CustomerTabNavigator] 🔒 Попытка открыть профиль без авторизации');
                    setIsAuthModalVisible(true);
                    return;
                  }

                  const event = props.navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    props.navigation.navigate(route.name);
                  }
                };

              // Обычные табы
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  style={styles.tabButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabContent}>
                    {options.tabBarIcon && options.tabBarIcon({
                      focused: isFocused,
                      color: isFocused ? theme.colors.primary : '#666',
                      size: 24,
                    })}
                    {options.tabBarLabel && typeof options.tabBarLabel === 'function' && (
                      options.tabBarLabel({
                        focused: isFocused,
                        color: isFocused ? theme.colors.primary : '#666',
                        position: 'below-icon',
                        children: route.name,
                      })
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </FloatingTabBar>
        )}
      >
        <Tab.Screen
          name="Home"
          component={AnimatedCustomerHomeScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color }]}>
                {t('home')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color}>
                <HomeIcon
                  width={25}
                  height={25}
                  color={color}
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
              <Text style={[styles.tabLabel, { color }]}>
                {t('categories')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color}>
                <CategoryIcon
                  width={25}
                  height={25}
                  color={color}
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
              <Text style={[styles.tabLabel, { color }]}>
                {t('my_orders')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color}>
                <MyOrdersIcon
                  width={25}
                  height={25}
                  color={color}
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
              <Text style={[styles.tabLabel, { color }]}>
                {t('profile')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color}>
                <ProfileIcon
                  width={25}
                  height={25}
                  color={color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
      </Tab.Navigator>

      {/* Bottom Sheet для авторизации */}
      <AuthRequiredModal
        visible={isAuthModalVisible}
        onClose={handleAuthModalClose}
        message={t('profile_auth_message')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: theme.fonts.weights.medium as any,
    marginTop: 4,
  },
}); 