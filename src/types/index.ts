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
  isVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
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
  category: string;
  location: string;
  budget: number; // изменил на number для удобства вычислений
  workersNeeded: number;
  serviceDate: string; // ISO date string
  photos?: string[]; // массив URL фотографий
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  customerId: string;
  applicantsCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// API Request Types
export interface CreateOrderRequest {
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  workersNeeded: number;
  serviceDate: string;
  photos?: string[];
}

// API Response Types
export interface CreateOrderResponse {
  success: boolean;
  data?: Order;
  error?: string;
}

// Applicant Types
export interface Applicant {
  id: string;
  orderId: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  rating?: number;
  completedJobs?: number;
  avatar?: string;
  message?: string;
  proposedPrice?: number; // предложенная цена исполнителя
  appliedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
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
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
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
