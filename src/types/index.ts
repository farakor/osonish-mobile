export * from './navigation';

// User Types
export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string; // ISO date string
  profileImage?: string;
  role: 'customer' | 'worker';
  city?: string;
  preferredLanguage?: 'ru' | 'uz'; // Предпочитаемый язык интерфейса
  isVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  // Поля для профессиональных мастеров
  workerType?: 'daily_worker' | 'professional';
  aboutMe?: string;
  specializations?: Specialization[];
  workPhotos?: string[];
  profileViewsCount?: number; // Количество просмотров профиля
}

// Specialization Types
export interface Specialization {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

export interface LoginRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface RegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  profileImage?: string;
  role: 'customer' | 'worker';
  city?: string;
  // Поля для профессиональных мастеров
  workerType?: 'daily_worker' | 'professional';
  aboutMe?: string;
  specializations?: Specialization[];
  workPhotos?: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
  requiresProfileInfo?: boolean;
  phone?: string;
}

// Order Types
export interface Order {
  id: string;
  title: string;
  description: string;
  category?: string; // Опциональное поле для обратной совместимости
  specializationId?: string; // ID специализации для профессиональных мастеров
  location: string;
  latitude?: number; // широта для расчета дистанции
  longitude?: number; // долгота для расчета дистанции
  budget: number; // изменил на number для удобства вычислений
  workersNeeded: number;
  serviceDate: string; // ISO date string
  photos?: string[]; // массив URL фотографий
  status: 'new' | 'response_received' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  customerId: string;
  customerCity?: string; // Город заказчика
  applicantsCount: number;
  pendingApplicantsCount?: number; // Количество непринятых откликов (ожидающих рассмотрения)
  viewsCount?: number; // Количество просмотров заказа
  // Дополнительные удобства
  transportPaid?: boolean; // Проезд оплачивается отдельно
  mealIncluded?: boolean; // Питание включено
  mealPaid?: boolean; // Питание оплачивается
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// API Request Types
export interface CreateOrderRequest {
  title: string;
  description: string;
  category?: string; // Опциональное поле для обратной совместимости (по умолчанию 'other')
  location: string;
  latitude?: number; // широта места выполнения заказа
  longitude?: number; // долгота места выполнения заказа
  budget: number;
  workersNeeded: number;
  serviceDate: string;
  photos?: string[];
  // Дополнительные удобства
  transportPaid?: boolean; // Проезд оплачивается отдельно
  mealIncluded?: boolean; // Питание включено
  mealPaid?: boolean; // Питание оплачивается
  specializationId?: string; // ID специализации для профессиональных мастеров
}

// API Response Types
export interface CreateOrderResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Update Order Types
export interface UpdateOrderRequest {
  orderId: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  workersNeeded?: number;
  photos?: string[];
  // Дополнительные удобства
  transportPaid?: boolean;
  mealIncluded?: boolean;
  mealPaid?: boolean;
  // Примечание: serviceDate намеренно исключена - дату нельзя изменять
}

export interface UpdateOrderResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Cancel Order Types
export interface CancelOrderResponse {
  success: boolean;
  error?: string;
}

// Applicant Types
export interface Applicant {
  id: string;
  orderId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  rating: number | null;
  completedJobs: number;
  avatar?: string;
  message?: string;
  proposedPrice: number; // предложенная цена исполнителя
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  isAvailable?: boolean; // доступность исполнителя на дату заказа
}

export interface CreateApplicantRequest {
  orderId: string;
  workerId: string;
  message?: string;
  proposedPrice?: number; // предложенная цена исполнителя
}

// Local Storage Types
export interface OrdersState {
  orders: Order[];
  lastUpdated: string;
}

export interface ApplicantsState {
  applicants: Applicant[];
  lastUpdated: string;
}

// Worker Application Types
export interface WorkerApplication {
  id: string;
  orderId: string;
  orderTitle: string;
  orderCategory: string;
  orderDescription: string;
  orderLocation: string;
  orderLatitude?: number;
  orderLongitude?: number;
  orderBudget: number;
  orderServiceDate: string;
  orderStatus: Order['status'];
  customerName: string;
  customerPhone: string;
  rating?: number;
  completedJobs?: number;
  message?: string;
  proposedPrice?: number;
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
}

// Review Types
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  workerId: string;
  rating: number; // 1-5 звезд
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  workerId: string;
  rating: number;
  comment?: string;
}

export interface WorkerRating {
  workerId: string;
  averageRating: number;
  totalReviews: number;
}

export interface Review {
  id: string;
  orderId: string;
  workerId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  orderTitle?: string;
}

export interface WorkerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  joinedAt: string;
  reviews: Review[];
}

// City Types
export interface City {
  id: string;
  name: string;
  isAvailable: boolean;
}

export interface CitySelectionData {
  selectedCity: City;
}