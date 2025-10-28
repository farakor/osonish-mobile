import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Админский Supabase клиент с SERVICE_ROLE_KEY
 * ⚠️ ВНИМАНИЕ: Использовать ТОЛЬКО для серверных операций!
 * - Отправка массовых уведомлений
 * - Административные задачи
 * - Операции, требующие обхода RLS
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || Constants.expoConfig?.extra?.supabaseServiceRoleKey;

// 🔍 Диагностика загрузки для отладки
console.log('[AdminClient] 🔍 Диагностика загрузки SERVICE_ROLE_KEY:');
console.log('[AdminClient] • Supabase URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('[AdminClient] • process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ЗАГРУЖЕН' : 'НЕ НАЙДЕН');
console.log('[AdminClient] • Constants.expoConfig.extra.supabaseServiceRoleKey:', Constants.expoConfig?.extra?.supabaseServiceRoleKey ? 'ЗАГРУЖЕН' : 'НЕ НАЙДЕН');
console.log('[AdminClient] • Итоговый ключ:', supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : 'НЕ ЗАГРУЖЕН');

// Предупреждение если ключ не настроен
if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'ВАШ_SERVICE_ROLE_KEY_СЮДА') {
  console.error('[AdminClient] ❌ SUPABASE_SERVICE_ROLE_KEY не настроен!');
  console.error('[AdminClient] ❌ Массовые уведомления работать НЕ БУДУТ!');
  console.error('[AdminClient] 💡 Решение:');
  console.error('[AdminClient] 💡 1. Проверьте файл .env (должен быть SUPABASE_SERVICE_ROLE_KEY)');
  console.error('[AdminClient] 💡 2. Перезапустите: npm start -- --clear');
  console.error('[AdminClient] 💡 3. Получить ключ: https://supabase.com/dashboard/project/qmbavgwkxtqudchuahdv/settings/api');
} else {
  console.log('[AdminClient] ✅ SERVICE_ROLE_KEY загружен успешно');
}

let supabaseAdminInstance: any = null;

try {
  if (supabaseUrl && supabaseServiceRoleKey && supabaseServiceRoleKey !== 'ВАШ_SERVICE_ROLE_KEY_СЮДА') {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'osonish-mobile-admin@1.0.0',
        },
      },
    });
    console.log('✅ Supabase ADMIN клиент создан успешно');
  } else {
    console.warn('⚠️ Supabase Admin клиент не настроен, админские операции будут ограничены');
  }
} catch (error) {
  console.error('❌ Ошибка создания Supabase Admin клиента:', error);
}

/**
 * Админский клиент Supabase с полными правами
 * Используйте ТОЛЬКО для:
 * - Массовых операций с уведомлениями
 * - Административных задач
 * - Операций, которые не должны проверяться RLS
 */
export const supabaseAdmin = supabaseAdminInstance;

/**
 * Проверка доступности админского клиента
 */
export const isAdminAvailable = (): boolean => {
  return supabaseAdminInstance !== null;
};
