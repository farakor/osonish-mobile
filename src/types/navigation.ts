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
  JobSeekerInfo: undefined; // Старый экран для ищущих вакансию
  JobSeekerInfoStepByStep: undefined; // Новый step-by-step экран для ищущих вакансию
  CitySelection: { role: 'customer' | 'worker'; workerType?: 'daily_worker' | 'professional' | 'job_seeker' };
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
  VacancyDetailsCustomer: { vacancyId: string }; // Детали вакансии для работодателя
  EditOrder: { orderId: string };
  ApplicantsList: { orderId: string; currentUser?: User };
  WorkerProfile: { workerId: string; workerName: string };
  ProfessionalMasterProfile: { masterId: string }; // Новый экран профиля профмастера
  JobSeekerProfile: { masterId: string }; // Экран резюме job_seeker
  ProfessionalMastersList: { specializationId?: string }; // Новый экран списка профмастеров
  Categories: { parentCategoryId?: string }; // Экран всех категорий с возможностью показа подкатегорий
  Rating: { orderId: string; acceptedWorkers: Applicant[] };
  CreateOrder: { // Создание заказа (перенесено из TabParamList)
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
  CreateVacancy: undefined; // Создание вакансии
  EditProfile: undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  Support: undefined;
  DocumentWebView: { url: string; title: string };
};

export type CustomerTabParamList = {
  Home: undefined;
  Categories: { parentCategoryId?: string };
  MyOrders: undefined;
  Profile: undefined;
};

export type WorkerStackParamList = {
  MainTabs: { screen?: keyof WorkerTabParamList; params?: any } | undefined;
  JobDetails: { orderId: string };
  VacancyDetails: { vacancyId: string }; // Детали вакансии
  EditProfile: undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  Support: undefined;
  // Новые экраны для функционала заказчика (доступные исполнителям)
  OrderDetails: { orderId: string }; // Детали заказа, созданного исполнителем
  EditOrder: { orderId: string }; // Редактирование заказа
  ApplicantsList: { orderId: string; currentUser?: User }; // Список откликов на заказ
  WorkerProfile: { workerId: string; workerName: string }; // Профиль другого исполнителя
  ProfessionalMasterProfile: { masterId: string }; // Профиль профессионального мастера
  JobSeekerProfile: { masterId: string }; // Экран резюме job_seeker
  ProfessionalMastersList: { specializationId?: string }; // Список мастеров по специализации
  Categories: { parentCategoryId?: string }; // Просмотр категорий
  Rating: { orderId: string; acceptedWorkers: Applicant[] }; // Оценка исполнителей
  CreateOrder: { // Создание заказа (перенесено из TabParamList)
    repeatOrderData?: {
      title: string;
      description: string;
      category?: string;
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
  DocumentWebView: { url: string; title: string };
};

export type WorkerTabParamList = {
  Jobs: undefined; // Доступные заказы для отклика
  Vacancies: undefined; // Вакансии (новое)
  Categories: { parentCategoryId?: string }; // Категории мастеров (новое)
  Applications: { initialStatus?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' } | undefined; // Мои отклики
  MyOrders: undefined; // Мои созданные заказы (новое)
  Profile: undefined; // Профиль
};
