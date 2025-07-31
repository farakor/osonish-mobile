// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Login: undefined;
  LoginSmsVerification: { phone: string };
  Registration: undefined;
  SmsVerification: { phone: string };
  ProfileInfo: { phone: string };
  RoleSelection: undefined;
  CustomerTabs: undefined;
  WorkerTabs: undefined;
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
  EditProfile: undefined;
  Notifications: undefined;
  Support: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  CreateOrder: undefined;
  MyOrders: undefined;
  Profile: undefined;
};

export type WorkerStackParamList = {
  MainTabs: undefined;
  JobDetails: { orderId: string };
  EditProfile: undefined;
  Notifications: undefined;
  Support: undefined;
};

export type WorkerTabParamList = {
  Jobs: undefined;
  Applications: undefined;
  Profile: undefined;
};
