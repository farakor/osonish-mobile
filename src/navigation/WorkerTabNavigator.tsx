import React, { useMemo } from 'react';
import { Text, Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { theme } from '../constants';
import { noElevationStyles } from '../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getBottomTabBarStyle } from '../utils/safeAreaUtils';
import { useNavigationTranslation, useWorkerTranslation } from '../hooks/useTranslation';
import { useAcceptedApplicationsCount } from '../hooks';
import { authService } from '../services/authService';
import type { WorkerTabParamList } from '../types';
import {
  WorkerJobsScreen,
  WorkerApplicationsScreen,
  WorkerProfileScreen,
  VacanciesScreen,
} from '../screens/worker';
// Импортируем компоненты из customer для переиспользования
import {
  CategoriesScreen,
} from '../screens/customer';
import {
  AnimatedTabIcon,
  AnimatedTabLabel,
  AnimatedTabIndicator,
  withAnimatedTabScreen,
  TabTooltip,
} from '../components/common';
import { FloatingTabBar } from '../components/navigation';
import HomeIcon from '../../assets/home-02.svg';
import FileIcon from '../../assets/file-02.svg';
import ProfileIcon from '../../assets/user-01.svg';
import CategoryIcon from '../../assets/card-icons/category.svg';
import VacancyIcon from '../../assets/vaccancy-icon.svg';

const Tab = createBottomTabNavigator<WorkerTabParamList>();

// Создаем анимированные версии экранов
const AnimatedWorkerJobsScreen = withAnimatedTabScreen(WorkerJobsScreen);
const AnimatedVacanciesScreen = withAnimatedTabScreen(VacanciesScreen);
const AnimatedCategoriesScreen = withAnimatedTabScreen(CategoriesScreen);
const AnimatedWorkerApplicationsScreen = withAnimatedTabScreen(WorkerApplicationsScreen);
const AnimatedWorkerProfileScreen = withAnimatedTabScreen(WorkerProfileScreen);

export function WorkerTabNavigator() {
  const insets = usePlatformSafeAreaInsets();
  const tabBarStyle = getBottomTabBarStyle(insets);
  const t = useNavigationTranslation();
  const tWorker = useWorkerTranslation();
  const { acceptedCount, showTooltip, dismissTooltip } = useAcceptedApplicationsCount();

  // Определяем тип работника
  const authState = authService.getAuthState();
  const workerType = (authState.user as any)?.workerType as 'daily_worker' | 'professional' | 'job_seeker' | undefined;
  
  // Однодневные работники не видят вакансии
  const shouldShowVacancies = workerType !== 'daily_worker';

  return (
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
        sceneStyle: { backgroundColor: '#FFFFFF' },
      }}
      tabBar={(props) => (
        <FloatingTabBar>
          {props.state.routes.map((route, index) => {
            const { options } = props.descriptors[route.key];
            const isFocused = props.state.index === index;

            const onPress = () => {
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
                  {/* Badge для Applications tab */}
                  {route.name === 'Applications' && acceptedCount > 0 && (
                    <>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {acceptedCount > 99 ? '99+' : acceptedCount}
                        </Text>
                      </View>
                      <TabTooltip
                        visible={!isFocused && showTooltip}
                        text={tWorker('accepted_applications_tooltip', { count: acceptedCount })}
                        color="#E10000"
                        onDismiss={dismissTooltip}
                      />
                    </>
                  )}
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
        name="Jobs"
        component={AnimatedWorkerJobsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color }]}>
              {t('jobs')}
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
      {/* Показываем вкладку "Вакансии" только для professional и job_seeker */}
      {shouldShowVacancies && (
        <Tab.Screen
          name="Vacancies"
          component={AnimatedVacanciesScreen}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color }]}>
                {t('vacancies')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color}>
                <VacancyIcon
                  width={25}
                  height={25}
                  color={color}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
      )}
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
        name="Applications"
        component={AnimatedWorkerApplicationsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color }]}>
              {t('applications')}
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused} color={color}>
              <FileIcon
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
        component={AnimatedWorkerProfileScreen}
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
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: theme.fonts.weights.medium as any,
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#E10000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
}); 