// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
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

export type WorkerTabParamList = {
  Jobs: undefined;
  Categories: undefined;
  Applications: undefined;
  Profile: undefined;
};
