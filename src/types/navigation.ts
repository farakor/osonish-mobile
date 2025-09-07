// Navigation types
import { Applicant, User } from './index';

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
  CitySelection: { role: 'customer' | 'worker' };
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
  MainTabs: undefined;
  OrderDetails: { orderId: string };
  EditOrder: { orderId: string };
  ApplicantsList: { orderId: string; currentUser?: User };
  WorkerProfile: { workerId: string; workerName: string };
  Rating: { orderId: string; acceptedWorkers: Applicant[] };
  EditProfile: undefined;
  Notifications: undefined;
  NotificationsList: undefined;
  Support: undefined;
  DocumentWebView: { url: string; title: string };
};

export type CustomerTabParamList = {
  Home: undefined;
  CreateOrder: undefined;
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
