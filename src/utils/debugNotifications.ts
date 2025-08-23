/**
 * Утилита для отладки проблем с уведомлениями
 */

import { supabase } from '../services/supabaseClient';
import { getTranslatedNotificationsForUsers } from './notificationTranslations';

/**
 * Отладка проблемы с дублированными уведомлениями
 */
export async function debugNotificationDuplication(): Promise<void> {
  console.log('\n🔍 === ОТЛАДКА ДУБЛИРОВАНИЯ УВЕДОМЛЕНИЙ ===');

  try {
    // 1. Получаем всех исполнителей из БД
    console.log('1️⃣ Получаем список исполнителей из БД...');
    const { data: workers, error } = await supabase
      .from('users')
      .select('id, preferred_language, first_name, last_name')
      .eq('role', 'worker');

    if (error) {
      console.error('❌ Ошибка получения исполнителей:', error);
      return;
    }

    console.log(`✅ Найдено ${workers?.length || 0} исполнителей`);

    if (!workers || workers.length === 0) {
      console.log('⚠️ Нет исполнителей в БД');
      return;
    }

    // 2. Проверяем на дублированные ID
    const workerIds = workers.map(w => w.id);
    const uniqueIds = new Set(workerIds);

    console.log(`📊 Всего ID: ${workerIds.length}, уникальных: ${uniqueIds.size}`);

    if (workerIds.length !== uniqueIds.size) {
      console.error('❌ НАЙДЕНЫ ДУБЛИРОВАННЫЕ ID ПОЛЬЗОВАТЕЛЕЙ!');
      const duplicates = workerIds.filter((id, index) => workerIds.indexOf(id) !== index);
      console.error('🔍 Дублированные ID:', duplicates);
    } else {
      console.log('✅ Дублированных ID не найдено');
    }

    // 3. Проверяем языки пользователей
    console.log('\n2️⃣ Анализируем языки пользователей:');
    const languageStats = {
      ru: 0,
      uz: 0,
      null: 0,
      undefined: 0
    };

    workers.forEach(worker => {
      const lang = worker.preferred_language;
      if (lang === 'ru') languageStats.ru++;
      else if (lang === 'uz') languageStats.uz++;
      else if (lang === null) languageStats.null++;
      else languageStats.undefined++;

      console.log(`  - ${worker.id} (${worker.first_name} ${worker.last_name}): язык = "${lang}"`);
    });

    console.log('📊 Статистика языков:', languageStats);

    // 4. Тестируем функцию переводов
    console.log('\n3️⃣ Тестируем функцию getTranslatedNotificationsForUsers...');

    const testParams = {
      title: 'Тестовый заказ',
      budget: 100000,
      location: 'Самарканд'
    };

    const translatedNotifications = await getTranslatedNotificationsForUsers(
      workerIds,
      'new_order',
      testParams
    );

    console.log(`📝 Функция вернула ${translatedNotifications.size} переводов`);
    console.log('🗂️ Детали переводов:');

    translatedNotifications.forEach((notification, userId) => {
      const worker = workers.find(w => w.id === userId);
      const expectedLang = worker?.preferred_language || 'ru';

      console.log(`  - ${userId}: "${notification.title}"`);
      console.log(`    Ожидаемый язык: ${expectedLang}`);
      console.log(`    Текст: "${notification.body}"`);

      // Проверяем, соответствует ли язык ожиданиям
      const isRussian = notification.title.includes('Новый заказ');
      const isUzbek = notification.title.includes('Yangi buyurtma');

      if (expectedLang === 'uz' && !isUzbek) {
        console.error(`    ❌ ОШИБКА: Ожидался узбекский, но получен другой язык!`);
      } else if (expectedLang === 'ru' && !isRussian) {
        console.error(`    ❌ ОШИБКА: Ожидался русский, но получен другой язык!`);
      } else {
        console.log(`    ✅ Язык соответствует ожиданиям`);
      }
    });

    // 5. Проверяем количество уведомлений на каждом языке
    console.log('\n4️⃣ Анализ количества уведомлений по языкам:');

    let russianCount = 0;
    let uzbekCount = 0;

    translatedNotifications.forEach((notification) => {
      if (notification.title.includes('Новый заказ')) {
        russianCount++;
      } else if (notification.title.includes('Yangi buyurtma')) {
        uzbekCount++;
      }
    });

    console.log(`📊 Русских уведомлений: ${russianCount}`);
    console.log(`📊 Узбекских уведомлений: ${uzbekCount}`);
    console.log(`📊 Общее количество: ${translatedNotifications.size}`);

    if (russianCount + uzbekCount !== translatedNotifications.size) {
      console.error('❌ ОШИБКА: Сумма не сходится! Возможно есть уведомления на неизвестном языке');
    }

    console.log('\n✅ Отладка завершена');

  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}

/**
 * Быстрый тест для проверки одного пользователя
 */
export async function debugSingleUserNotification(userId: string): Promise<void> {
  console.log(`\n🔍 === ОТЛАДКА УВЕДОМЛЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ ${userId} ===`);

  try {
    // Получаем данные пользователя
    const { data: user, error } = await supabase
      .from('users')
      .select('id, preferred_language, first_name, last_name, role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('❌ Пользователь не найден:', error);
      return;
    }

    console.log('👤 Данные пользователя:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Имя: ${user.first_name} ${user.last_name}`);
    console.log(`  - Роль: ${user.role}`);
    console.log(`  - Язык: "${user.preferred_language}"`);

    // Тестируем перевод
    const translatedNotifications = await getTranslatedNotificationsForUsers(
      [userId],
      'new_order',
      {
        title: 'Тестовый заказ',
        budget: 50000,
        location: 'Самарканд'
      }
    );

    console.log(`📝 Получено переводов: ${translatedNotifications.size}`);

    const notification = translatedNotifications.get(userId);
    if (notification) {
      console.log('📨 Уведомление:');
      console.log(`  - Заголовок: "${notification.title}"`);
      console.log(`  - Текст: "${notification.body}"`);

      const isRussian = notification.title.includes('Новый заказ');
      const isUzbek = notification.title.includes('Yangi buyurtma');

      console.log(`  - Определенный язык: ${isRussian ? 'русский' : isUzbek ? 'узбекский' : 'неизвестный'}`);
    } else {
      console.error('❌ Уведомление не найдено для пользователя');
    }

  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
}
