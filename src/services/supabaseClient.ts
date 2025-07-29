import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Настройки Supabase проекта
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
          status: 'active' | 'in_progress' | 'completed' | 'cancelled';
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
          status?: 'active' | 'in_progress' | 'completed' | 'cancelled';
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
          status?: 'active' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count?: number;
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
    };
  };
} 