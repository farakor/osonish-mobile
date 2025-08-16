import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// 🔧 НАСТРОЙКА SUPABASE:
// 1. Создайте проект на https://supabase.com
// 2. Скопируйте ваши URL и ключи из Settings -> API
// 3. Скопируйте этот файл как supabaseClient.ts
// 4. Замените YOUR_SUPABASE_URL и YOUR_SUPABASE_ANON_KEY на ваши реальные значения

const supabaseUrl = 'https://qmbavgwkxtqudchuahdv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYmF2Z3dreHRxdWRjaHVhaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODkzNzksImV4cCI6MjA2OTM2NTM3OX0.Gn5_S1eYrFpXNXMVHO0zfb8dclNZG1cjAqLHb5Wq0D4';

// Проверяем что URL корректный
if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
  console.error('❌ Supabase URL не настроен! Используйте ваш реальный URL.');
}
if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
  console.error('❌ Supabase ANON KEY не настроен! Используйте ваш реальный ключ.');
}

// Создаем Supabase клиент с проверкой
let supabaseInstance: any = null;

try {
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_SUPABASE_URL')) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log('✅ Supabase клиент создан успешно');
  } else {
    console.warn('⚠️ Supabase не настроен, используется fallback режим');
  }
} catch (error) {
  console.error('❌ Ошибка создания Supabase клиента:', error);
}

export const supabase = supabaseInstance;

// Типы для базы данных
export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          location: string;
          budget: number;
          workers_needed: number;
          service_date: string;
          photos: string[];
          customer_id: string;
          status: 'new' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          location: string;
          budget: number;
          workers_needed: number;
          service_date: string;
          photos?: string[];
          customer_id: string;
          status?: 'new' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          location?: string;
          budget?: number;
          workers_needed?: number;
          service_date?: string;
          photos?: string[];
          customer_id?: string;
          status?: 'new' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      applicants: {
        Row: {
          id: string;
          order_id: string;
          worker_id: string;
          worker_name: string;
          worker_phone: string;
          rating?: number;
          completed_jobs?: number;
          message?: string;
          proposed_price?: number;
          applied_at: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          worker_id: string;
          worker_name: string;
          worker_phone: string;
          rating?: number;
          completed_jobs?: number;
          message?: string;
          proposed_price?: number;
          applied_at?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          worker_id?: string;
          worker_name?: string;
          worker_phone?: string;
          rating?: number;
          completed_jobs?: number;
          message?: string;
          proposed_price?: number;
          applied_at?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          phone: string;
          first_name: string;
          last_name: string;
          middle_name?: string;
          birth_date: string;
          role: 'customer' | 'worker';
          profile_image?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          first_name: string;
          last_name: string;
          middle_name?: string;
          birth_date: string;
          role: 'customer' | 'worker';
          profile_image?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          first_name?: string;
          last_name?: string;
          middle_name?: string;
          birth_date?: string;
          role?: 'customer' | 'worker';
          profile_image?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'new_order' | 'new_application' | 'order_update' | 'order_completed';
          is_read: boolean;
          data?: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'new_order' | 'new_application' | 'order_update' | 'order_completed';
          is_read?: boolean;
          data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: 'new_order' | 'new_application' | 'order_update' | 'order_completed';
          is_read?: boolean;
          data?: any;
          created_at?: string;
        };
      };
    };
  };
} 