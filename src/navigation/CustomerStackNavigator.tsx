import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../types/navigation';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { OrderDetailsScreen, EditOrderScreen, EditProfileScreen, NotificationsScreen, NotificationsListScreen, SupportScreen, ApplicantsListScreen, RatingScreen, WorkerProfileScreen, ProfessionalMastersListScreen, ProfessionalMasterProfileScreen, JobSeekerProfileScreen, CategoriesScreen, CreateOrderStepByStepScreen, CreateVacancyStepByStepScreen, VacancyDetailsCustomerScreen, ApplicantResumeScreen, EditVacancyScreen } from '../screens/customer';
import { JobDetailsScreen, VacancyDetailsScreen } from '../screens/worker';
import { DocumentWebViewScreen } from '../screens/shared';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' }, // Светло-синий фон
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={CustomerTabNavigator}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="VacancyDetailsCustomer"
        component={VacancyDetailsCustomerScreen}
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
        name="JobDetails"
        component={JobDetailsScreen}
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
        name="EditVacancy"
        component={EditVacancyScreen}
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
        name="ProfessionalMastersList"
        component={ProfessionalMastersListScreen}
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
        name="ApplicantResume"
        component={ApplicantResumeScreen}
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
        name="CreateOrder"
        component={CreateOrderStepByStepScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="CreateVacancy"
        component={CreateVacancyStepByStepScreen}
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
      <Stack.Screen
        name="Rating"
        component={RatingScreen}
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