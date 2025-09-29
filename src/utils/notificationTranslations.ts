import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';

// Типы для переводов уведомлений
export type NotificationType =
  | 'new_order'
  | 'new_application'
  | 'worker_selected'
  | 'order_completed'
  | 'order_updated'
  | 'order_cancelled'
  | 'work_reminder'
  | 'complete_work_reminder';

export type Language = 'ru' | 'uz';

// Переводы уведомлений
const translations = {
  ru: {
    new_order_title: 'Новый заказ!',
    new_order_body: '{{title}} - {{budget}} сум в {{location}}',
    new_application_title: 'Новый отклик на ваш заказ!',
    new_application_body: '{{workerName}} откликнулся на "{{orderTitle}}"',
    worker_selected_title: 'Вас выбрали для выполнения заказа!',
    worker_selected_body: 'Поздравляем! Вас выбрали для заказа "{{orderTitle}}" за {{budget}} сум',
    order_completed_title: 'Заказ завершен!',
    order_completed_body: 'Заказ "{{orderTitle}}" успешно завершен. Спасибо за отличную работу!',
    order_updated_title: 'Заказ обновлен',
    order_updated_body: 'Заказ "{{orderTitle}}" был изменен заказчиком',
    order_cancelled_title: 'Заказ отменен',
    order_cancelled_body: 'Заказ "{{orderTitle}}" был отменен заказчиком',
    work_reminder_title: 'Напоминание о работе',
    work_reminder_body: 'Завтра у вас запланирована работа "{{orderTitle}}" по адресу {{location}}',
    complete_work_reminder_title: 'Не забудьте завершить работу',
    complete_work_reminder_body: 'Пожалуйста, завершите заказ "{{orderTitle}}" и оцените работу исполнителя'
  },
  uz: {
    new_order_title: 'Yangi buyurtma!',
    new_order_body: '{{title}} - {{budget}} so\'m {{location}}da',
    new_application_title: 'Buyurtmangizga yangi javob!',
    new_application_body: '{{workerName}} "{{orderTitle}}" buyurtmasiga javob berdi',
    worker_selected_title: 'Siz buyurtmani bajarish uchun tanlangansiz!',
    worker_selected_body: 'Tabriklaymiz! Siz "{{orderTitle}}" buyurtmasini {{budget}} so\'mga bajarish uchun tanlangansiz',
    order_completed_title: 'Buyurtma tugallandi!',
    order_completed_body: '"{{orderTitle}}" buyurtmasi muvaffaqiyatli tugallandi. Ajoyib ish uchun rahmat!',
    order_updated_title: 'Buyurtma yangilandi',
    order_updated_body: '"{{orderTitle}}" buyurtmasi buyurtmachi tomonidan o\'zgartirildi',
    order_cancelled_title: 'Buyurtma bekor qilindi',
    order_cancelled_body: '"{{orderTitle}}" buyurtmasi buyurtmachi tomonidan bekor qilindi',
    work_reminder_title: 'Ish haqida eslatma',
    work_reminder_body: 'Ertaga sizda "{{orderTitle}}" ishi {{location}} manzilida rejalashtirilgan',
    complete_work_reminder_title: 'Ishni tugatishni unutmang',
    complete_work_reminder_body: 'Iltimos, "{{orderTitle}}" buyurtmasini tugating va ijrochining ishini baholang'
  }
};

/**
 * Получить язык пользователя из AsyncStorage
 */
export async function getUserLanguage(): Promise<Language> {
  try {
    const savedLanguage = await AsyncStorage.getItem('osonish_selected_language');
    return (savedLanguage === 'uz') ? 'uz' : 'ru'; // По умолчанию русский
  } catch (error) {
    console.error('[NotificationTranslations] Ошибка получения языка:', error);
    return 'ru'; // Fallback к русскому
  }
}

/**
 * Получить язык пользователя из базы данных (если сохранен в профиле)
 */
export async function getUserLanguageFromDB(userId: string): Promise<Language> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('preferred_language')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Если нет данных в БД, используем русский как язык по умолчанию
      // НЕ используем AsyncStorage, так как это язык текущего пользователя, а не целевого!
      console.log(`[NotificationTranslations] Язык не найден для пользователя ${userId}, используем русский по умолчанию`);
      return 'ru';
    }

    const language = (data.preferred_language === 'uz') ? 'uz' : 'ru';
    console.log(`[NotificationTranslations] Язык пользователя ${userId} из БД: ${language}`);
    return language;
  } catch (error) {
    console.error('[NotificationTranslations] Ошибка получения языка из БД:', error);
    // Fallback к русскому языку (НЕ к AsyncStorage!)
    return 'ru';
  }
}

/**
 * Заменить плейсхолдеры в тексте
 */
function replacePlaceholders(text: string, params: Record<string, any>): string {
  let result = text;

  Object.keys(params).forEach(key => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), params[key]?.toString() || '');
  });

  return result;
}

/**
 * Получить переведенный заголовок уведомления
 */
export function getNotificationTitle(
  type: NotificationType,
  language: Language = 'ru'
): string {
  const titleKey = `${type}_title` as keyof typeof translations.ru;
  return translations[language][titleKey] || translations.ru[titleKey];
}

/**
 * Получить переведенный текст уведомления с подстановкой параметров
 */
export function getNotificationBody(
  type: NotificationType,
  params: Record<string, any> = {},
  language: Language = 'ru'
): string {
  const bodyKey = `${type}_body` as keyof typeof translations.ru;
  const template = translations[language][bodyKey] || translations.ru[bodyKey];
  return replacePlaceholders(template, params);
}

/**
 * Получить переведенное уведомление (заголовок + текст)
 */
export async function getTranslatedNotification(
  userId: string,
  type: NotificationType,
  params: Record<string, any> = {}
): Promise<{ title: string; body: string }> {
  try {
    // Получаем язык пользователя
    const language = await getUserLanguageFromDB(userId);

    // Получаем переведенные тексты
    const title = getNotificationTitle(type, language);
    const body = getNotificationBody(type, params, language);

    console.log(`[NotificationTranslations] Уведомление для пользователя ${userId} на языке ${language}:`, { title, body });

    return { title, body };
  } catch (error) {
    console.error('[NotificationTranslations] Ошибка перевода уведомления:', error);

    // Fallback к русскому языку
    const title = getNotificationTitle(type, 'ru');
    const body = getNotificationBody(type, params, 'ru');

    return { title, body };
  }
}

/**
 * Получить переведенные уведомления для нескольких пользователей
 */
export async function getTranslatedNotificationsForUsers(
  userIds: string[],
  type: NotificationType,
  params: Record<string, any> = {}
): Promise<Map<string, { title: string; body: string }>> {
  const result = new Map<string, { title: string; body: string }>();

  // Проверяем, что есть пользователи для уведомлений
  if (!userIds || userIds.length === 0) {
    console.log('[NotificationTranslations] Нет пользователей для отправки уведомлений');
    return result;
  }

  try {
    // Получаем языки всех пользователей из БД одним запросом
    const { data: users, error } = await supabase
      .from('users')
      .select('id, preferred_language')
      .in('id', userIds);

    if (error) {
      console.warn('[NotificationTranslations] ⚠️ Не удалось получить языки пользователей, используем русский по умолчанию');
      // Fallback: все пользователи получают уведомления на русском
      userIds.forEach(userId => {
        const title = getNotificationTitle(type, 'ru');
        const body = getNotificationBody(type, params, 'ru');
        result.set(userId, { title, body });
      });
      return result;
    }

    // Создаем карту языков пользователей
    const userLanguages = new Map<string, Language>();
    users?.forEach(user => {
      const language = (user.preferred_language === 'uz') ? 'uz' : 'ru';
      userLanguages.set(user.id, language);
    });

    // Генерируем уведомления для каждого пользователя
    userIds.forEach(userId => {
      // Если язык пользователя найден в БД, используем его
      // Иначе используем русский как язык по умолчанию (не текущий язык!)
      const language = userLanguages.get(userId) || 'ru';
      const title = getNotificationTitle(type, language);
      const body = getNotificationBody(type, params, language);
      result.set(userId, { title, body });

      console.log(`[NotificationTranslations] Пользователь ${userId}: язык ${language}, заголовок: "${title}"`);
    });

    console.log(`[NotificationTranslations] Сгенерированы уведомления для ${userIds.length} пользователей`);

  } catch (error) {
    console.warn('[NotificationTranslations] ⚠️ Ошибка генерации уведомлений, используем русский по умолчанию');

    // Fallback: все пользователи получают уведомления на русском
    userIds.forEach(userId => {
      const title = getNotificationTitle(type, 'ru');
      const body = getNotificationBody(type, params, 'ru');
      result.set(userId, { title, body });
    });
  }
  return result;
}
