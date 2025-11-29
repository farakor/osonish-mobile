import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkerTabNavigator } from './WorkerTabNavigator';
import { EditProfileScreen, JobDetailsScreen, NotificationsScreen, NotificationsListScreen, SupportScreen, VacancyDetailsScreen } from '../screens/worker';
// Импортируем компоненты из customer для переиспользования
import { 
  OrderDetailsScreen, 
  EditOrderScreen, 
  ApplicantsListScreen, 
  WorkerProfileScreen, 
  ProfessionalMasterProfileScreen, 
  JobSeekerProfileScreen,
  ProfessionalMastersListScreen,
  CategoriesScreen,
  RatingScreen,
  CreateOrderStepByStepScreen,
  MyOrdersScreen
} from '../screens/customer';
import { WorkerStackParamList } from '../types/navigation';
import { DocumentWebViewScreen } from '../screens/shared';

const Stack = createNativeStackNavigator<WorkerStackParamList>();

export function WorkerStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F5FC' }, // Светло-синий фон
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={WorkerTabNavigator}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="VacancyDetails"
        component={VacancyDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsListScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{
          presentation: 'card',
        }}
      />
      {/* Экран Мои заказы (перенесен из TabNavigator) */}
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          presentation: 'card',
        }}
      />
      {/* Новые экраны для функционала заказчика (доступные исполнителям) */}
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditOrder"
        component={EditOrderScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ApplicantsList"
        component={ApplicantsListScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ProfessionalMasterProfile"
        component={ProfessionalMasterProfileScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobSeekerProfile"
        component={JobSeekerProfileScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ProfessionalMastersList"
        component={ProfessionalMastersListScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderStepByStepScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="DocumentWebView"
        component={DocumentWebViewScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
} 