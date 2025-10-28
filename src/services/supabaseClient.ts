import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 🔧 НАСТРОЙКА SUPABASE С ПОДДЕРЖКОЙ РАЗНЫХ СРЕД:
// 1. Создайте два проекта на https://supabase.com (development и production)
// 2. Настройте переменные в .env.development и .env.production
// 3. Используйте npm run start:dev для тестирования, npm run start:prod для продакшена

// Получаем настройки из переменных окружения
// Приоритет: process.env (из EAS билда) → Constants.expoConfig.extra (из app.json) → .env файлы
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

// Определяем среду выполнения
const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
const environment = isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION';

// Логируем информацию о текущей среде
console.log(`🌍 Запуск в режиме: ${environment}`);
console.log(`🔗 Supabase URL: ${supabaseUrl}`);
console.log(`📱 Режим разработки: ${isDevelopment ? 'ДА' : 'НЕТ'}`);

// Предупреждение при использовании продакшен данных в режиме разработки
if (isDevelopment && supabaseUrl?.includes('qmbavgwkxtqudchuahdv')) {
  console.warn('⚠️ ВНИМАНИЕ: Вы используете ПРОДАКШЕН базу данных в режиме разработки!');
  console.warn('⚠️ Рекомендуется создать отдельный проект Supabase для тестирования.');
}

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
        // Добавляем настройки для улучшения persistence в React Native
        storage: undefined, // Используем стандартное хранилище
        storageKey: 'sb-auth-token', // Кастомный ключ для хранения
        flowType: 'pkce', // Используем PKCE flow для мобильных приложений
      },
      // Настройки для React Native
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      // Добавляем таймауты для стабильности
      global: {
        headers: {
          'X-Client-Info': 'osonish-mobile@1.0.0',
        },
      },
    });
    console.log('✅ Supabase клиент создан успешно с улучшенной конфигурацией');
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
          category?: string; // Опциональное поле
          location: string;
          budget: number;
          workers_needed: number;
          service_date: string;
          photos: string[];
          customer_id: string;
          status: 'new' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count: number;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category?: string; // Опциональное поле
          location: string;
          budget: number;
          workers_needed: number;
          service_date: string;
          photos?: string[];
          customer_id: string;
          status?: 'new' | 'in_progress' | 'completed' | 'cancelled';
          applicants_count?: number;
          views_count?: number;
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
          views_count?: number;
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
          profile_views_count: number;
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
          profile_views_count?: number;
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
          profile_views_count?: number;
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
      scheduled_reminders: {
        Row: {
          id: string;
          worker_id: string;
          order_id: string;
          reminder_date: string;
          reminder_type: string;
          is_sent: boolean;
          sent_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          order_id: string;
          reminder_date: string;
          reminder_type?: string;
          is_sent?: boolean;
          sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          order_id?: string;
          reminder_date?: string;
          reminder_type?: string;
          is_sent?: boolean;
          sent_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}