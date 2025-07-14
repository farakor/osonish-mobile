// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Registration: undefined;
  SmsVerification: { phone: string };
  RoleSelection: undefined;
  CustomerTabs: undefined;
  WorkerTabs: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Registration: undefined;
  SmsVerification: { phone: string };
};

export type CustomerStackParamList = {
  CustomerTabs: undefined;
  OrderDetails: { orderId: string };
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
