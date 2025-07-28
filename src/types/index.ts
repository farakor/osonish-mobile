export * from './navigation';

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
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
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

// Local Storage Types
export interface OrdersState {
  orders: Order[];
  lastUpdated: string;
}
