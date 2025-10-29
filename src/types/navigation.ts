// Navigation types
import { Applicant, User, City, Specialization } from './index';

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Auth: undefined;
  Login: undefined;
  LoginSmsVerification: { phone: string };
  Registration: undefined;
  SmsVerification: { phone: string };
  ProfileInfo: { phone: string };
  RoleSelection: undefined;
  WorkerTypeSelection: undefined; // Новый экран выбора типа исполнителя
  SpecializationSelection: undefined; // Новый экран выбора специализаций
  ProfessionalAboutMe: undefined; // Новый экран "О себе" для профмастеров
  CitySelection: { role: 'customer' | 'worker'; workerType?: 'daily_worker' | 'professional' };
  Loading: {
    profileData: any;
    role: 'customer' | 'worker';
    selectedCity: City;
  };
  CustomerTabs: undefined;
  WorkerTabs: undefined;
  DocumentWebView: { url: string; title: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Registration: undefined;
  SmsVerification: { phone: string };
  ProfileInfo: { phone: string };
};

export type CustomerStackParamList = {
  MainTabs: {
    screen?: keyof CustomerTabParamList;
    params?: CustomerTabParamList[keyof CustomerTabParamList];
  } | undefined;
  OrderDetails: { orderId: string };
  EditOrder: { orderId: string };
  ApplicantsList: { orderId: string; currentUser?: User };
  WorkerProfile: { workerId: string; workerName: string };
  ProfessionalMasterProfile: { masterId: string }; // Новый экран профиля профмастера
  ProfessionalMastersList: { specializationId?: string }; // Новый экран списка профмастеров
  Categories: { parentCategoryId?: string }; // Экран всех категорий с возможностью показа подкатегорий
  Rating: { orderId: string; acceptedWorkers: Applicant[] };
  EditProfile: undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  Support: undefined;
  DocumentWebView: { url: string; title: string };
};

export type CustomerTabParamList = {
  Home: undefined;
  Categories: { parentCategoryId?: string };
  CreateOrder: {
    repeatOrderData?: {
      title: string;
      description: string;
      category?: string; // Опциональное поле
      location: string;
      latitude?: number;
      longitude?: number;
      budget: number;
      workersNeeded: number;
      photos?: string[];
      transportPaid?: boolean;
      mealIncluded?: boolean;
      mealPaid?: boolean;
    };
    startFromDateStep?: boolean;
  } | undefined;
  MyOrders: undefined;
  Profile: undefined;
};

export type WorkerStackParamList = {
  MainTabs: { screen?: keyof WorkerTabParamList; params?: any } | undefined;
  JobDetails: { orderId: string };
  EditProfile: undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  Support: undefined;
  DocumentWebView: { url: string; title: string };
};

export type WorkerTabParamList = {
  Jobs: undefined;
  Applications: { initialStatus?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' } | undefined;
  Profile: undefined;
};
