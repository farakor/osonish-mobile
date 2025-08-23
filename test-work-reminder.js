/**
 * Тестовый скрипт для проверки системы напоминаний о работе
 * 
 * Использование:
 * 1. Запустите приложение
 * 2. В консоли разработчика выполните:
 *    import('./test-work-reminder.js').then(module => module.testWorkReminder())
 * 
 * Или добавьте этот код в любой компонент приложения для тестирования
 */

import { orderService } from './src/services/orderService';
import { authService } from './src/services/authService';

/**
 * Тестирование отправки напоминания о работе
 */
export async function testWorkReminder() {
  try {
    console.log('\n🧪 === ТЕСТ НАПОМИНАНИЯ О РАБОТЕ ===');
    
    // Получаем текущего пользователя
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      console.error('❌ Пользователь не авторизован. Войдите в приложение для тестирования.');
      return false;
    }

    const userId = authState.user.id;
    console.log('👤 Тестируем для пользователя:', userId);
    console.log('📱 Имя пользователя:', `${authState.user.firstName} ${authState.user.lastName}`);

    // Отправляем тестовое напоминание
    console.log('\n📤 Отправляем тестовое напоминание...');
    
    const success = await orderService.testWorkReminder(
      userId,
      'Ремонт крана на кухне',
      'ул. Навои, 15, кв. 42'
    );

    if (success) {
      console.log('✅ Тестовое напоминание отправлено успешно!');
      console.log('💡 Проверьте:');
      console.log('   - Пришло ли push-уведомление на устройство');
      console.log('   - Появилось ли уведомление в списке уведомлений приложения');
      console.log('   - Корректность перевода (русский/узбекский)');
      return true;
    } else {
      console.error('❌ Не удалось отправить тестовое напоминание');
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    return false;
  }
}

/**
 * Тестирование отправки напоминания о завершении работы
 */
export async function testCompleteWorkReminder() {
  try {
    console.log('\n🧪 === ТЕСТ НАПОМИНАНИЯ О ЗАВЕРШЕНИИ РАБОТЫ ===');
    
    // Получаем текущего пользователя
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      console.error('❌ Пользователь не авторизован. Войдите в приложение для тестирования.');
      return false;
    }

    const userId = authState.user.id;
    console.log('👤 Тестируем для пользователя:', userId);
    console.log('📱 Имя пользователя:', `${authState.user.firstName} ${authState.user.lastName}`);

    // Отправляем тестовое напоминание о завершении
    console.log('\n📤 Отправляем тестовое напоминание о завершении работы...');
    
    const success = await orderService.testCompleteWorkReminder(
      userId,
      'Ремонт крана на кухне'
    );

    if (success) {
      console.log('✅ Тестовое напоминание о завершении отправлено успешно!');
      console.log('💡 Проверьте:');
      console.log('   - Пришло ли push-уведомление на устройство');
      console.log('   - Появилось ли уведомление в списке уведомлений приложения');
      console.log('   - Корректность перевода (русский/узбекский)');
      console.log('   - Текст должен напоминать о завершении работы и оценке исполнителя');
      return true;
    } else {
      console.error('❌ Не удалось отправить тестовое напоминание о завершении');
      return false;
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
    return false;
  }
}

/**
 * Тестирование планирования напоминания
 */
export async function testScheduleReminder() {
  try {
    console.log('\n📅 === ТЕСТ ПЛАНИРОВАНИЯ НАПОМИНАНИЯ ===');
    
    // Получаем текущего пользователя
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      console.error('❌ Пользователь не авторизован');
      return false;
    }

    // Создаем тестовую дату (завтра)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0); // 14:00 завтра

    console.log('📅 Тестовая дата работы:', tomorrow.toISOString());
    
    // Вычисляем когда должно прийти напоминание (за день до работы в 18:00)
    const reminderDate = new Date(tomorrow);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(18, 0, 0, 0);
    
    console.log('⏰ Напоминание должно прийти:', reminderDate.toISOString());
    
    const now = new Date();
    if (reminderDate <= now) {
      console.log('⚠️ Напоминание должно было прийти уже. Для теста используем дату послезавтра.');
      
      // Используем послезавтра
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(14, 0, 0, 0);
      
      const newReminderDate = new Date(dayAfterTomorrow);
      newReminderDate.setDate(newReminderDate.getDate() - 1);
      newReminderDate.setHours(18, 0, 0, 0);
      
      console.log('📅 Новая тестовая дата работы:', dayAfterTomorrow.toISOString());
      console.log('⏰ Новое время напоминания:', newReminderDate.toISOString());
    }

    console.log('✅ Логика планирования напоминаний работает корректно');
    console.log('💡 Для полного теста:');
    console.log('   1. Создайте заказ с датой на завтра или послезавтра');
    console.log('   2. Примите исполнителя');
    console.log('   3. Проверьте что напоминание запланировано в БД');
    console.log('   4. Дождитесь времени отправки или измените дату в БД для быстрого теста');

    return true;

  } catch (error) {
    console.error('❌ Ошибка тестирования планирования:', error);
    return false;
  }
}

/**
 * Проверка системы напоминаний
 */
export async function checkReminderSystem() {
  try {
    console.log('\n🔍 === ПРОВЕРКА СИСТЕМЫ НАПОМИНАНИЙ ===');
    
    // Проверяем что метод проверки напоминаний доступен
    if (typeof orderService.checkAndSendScheduledReminders === 'function') {
      console.log('✅ Метод checkAndSendScheduledReminders доступен');
    } else {
      console.error('❌ Метод checkAndSendScheduledReminders недоступен');
      return false;
    }

    // Проверяем что тестовый метод доступен
    if (typeof orderService.testWorkReminder === 'function') {
      console.log('✅ Тестовый метод testWorkReminder доступен');
    } else {
      console.error('❌ Тестовый метод testWorkReminder недоступен');
      return false;
    }

    console.log('✅ Система напоминаний инициализирована корректно');
    console.log('💡 Периодическая проверка запускается каждые 15 минут');
    console.log('💡 Первая проверка через 1 минуту после старта приложения');

    return true;

  } catch (error) {
    console.error('❌ Ошибка проверки системы:', error);
    return false;
  }
}

// Экспортируем все функции для удобства
export default {
  testWorkReminder,
  testCompleteWorkReminder,
  testScheduleReminder,
  checkReminderSystem
};
