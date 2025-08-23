import {
  getTranslatedNotification,
  getTranslatedNotificationsForUsers,
  getNotificationTitle,
  getNotificationBody
} from './notificationTranslations';

/**
 * Тестирование системы переводов уведомлений
 */
export async function testNotificationTranslations() {
  console.log('\n🧪 === ТЕСТИРОВАНИЕ СИСТЕМЫ ПЕРЕВОДОВ УВЕДОМЛЕНИЙ ===\n');

  try {
    // Тест 1: Проверка базовых переводов
    console.log('📝 Тест 1: Базовые переводы');

    const ruTitle = getNotificationTitle('new_order', 'ru');
    const uzTitle = getNotificationTitle('new_order', 'uz');

    console.log(`  Русский заголовок: "${ruTitle}"`);
    console.log(`  Узбекский заголовок: "${uzTitle}"`);

    const ruBody = getNotificationBody('new_order', {
      title: 'Ремонт крана',
      budget: 50000,
      location: 'Самарканд'
    }, 'ru');

    const uzBody = getNotificationBody('new_order', {
      title: 'Ремонт крана',
      budget: 50000,
      location: 'Самарканд'
    }, 'uz');

    console.log(`  Русский текст: "${ruBody}"`);
    console.log(`  Узбекский текст: "${uzBody}"`);

    // Тест 2: Проверка перевода для конкретного пользователя
    console.log('\n📝 Тест 2: Перевод для пользователя');

    // Создаем тестовых пользователей
    const testUserRu = 'test-user-ru-123';
    const testUserUz = 'test-user-uz-456';

    console.log(`  Тестируем для пользователя ${testUserRu} (должен быть русский)`);
    const notificationRu = await getTranslatedNotification(testUserRu, 'worker_selected', {
      orderTitle: 'Установка кондиционера',
      budget: 100000
    });

    console.log(`    Заголовок: "${notificationRu.title}"`);
    console.log(`    Текст: "${notificationRu.body}"`);

    console.log(`  Тестируем для пользователя ${testUserUz} (должен быть русский, т.к. нет в БД)`);
    const notificationUz = await getTranslatedNotification(testUserUz, 'worker_selected', {
      orderTitle: 'Установка кондиционера',
      budget: 100000
    });

    console.log(`    Заголовок: "${notificationUz.title}"`);
    console.log(`    Текст: "${notificationUz.body}"`);

    // Тест 3: Массовый перевод для группы пользователей
    console.log('\n📝 Тест 3: Массовый перевод');

    const userIds = [testUserRu, testUserUz, 'test-user-3', 'test-user-4'];
    const translations = await getTranslatedNotificationsForUsers(userIds, 'order_completed', {
      orderTitle: 'Покраска забора'
    });

    console.log(`  Переводы для ${userIds.length} пользователей:`);
    translations.forEach((translation, userId) => {
      console.log(`    ${userId}: "${translation.title}" - "${translation.body}"`);
    });

    // Тест 4: Проверка всех типов уведомлений
    console.log('\n📝 Тест 4: Все типы уведомлений на русском');

    const notificationTypes = [
      'new_order',
      'new_application',
      'worker_selected',
      'order_completed',
      'order_updated',
      'order_cancelled'
    ] as const;

    notificationTypes.forEach(type => {
      const title = getNotificationTitle(type, 'ru');
      const body = getNotificationBody(type, {
        title: 'Тестовый заказ',
        orderTitle: 'Тестовый заказ',
        budget: 75000,
        location: 'Ташкент',
        workerName: 'Иван Петров'
      }, 'ru');

      console.log(`    ${type}:`);
      console.log(`      Заголовок: "${title}"`);
      console.log(`      Текст: "${body}"`);
    });

    // Тест 5: Проверка всех типов уведомлений на узбекском
    console.log('\n📝 Тест 5: Все типы уведомлений на узбекском');

    notificationTypes.forEach(type => {
      const title = getNotificationTitle(type, 'uz');
      const body = getNotificationBody(type, {
        title: 'Тестовый заказ',
        orderTitle: 'Тестовый заказ',
        budget: 75000,
        location: 'Ташкент',
        workerName: 'Иван Петров'
      }, 'uz');

      console.log(`    ${type}:`);
      console.log(`      Заголовок: "${title}"`);
      console.log(`      Текст: "${body}"`);
    });

    console.log('\n✅ Все тесты переводов завершены успешно!');

    return {
      success: true,
      message: 'Все тесты прошли успешно'
    };

  } catch (error) {
    console.error('\n❌ Ошибка при тестировании переводов:', error);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Симуляция сценария: русскоязычный заказчик выбирает узбекскоязычного исполнителя
 */
export async function simulateMultilingualScenario() {
  console.log('\n🎭 === СИМУЛЯЦИЯ МНОГОЯЗЫЧНОГО СЦЕНАРИЯ ===\n');

  try {
    // Сценарий: Заказчик (русский) выбирает исполнителя (узбекский)
    console.log('📋 Сценарий: Русскоязычный заказчик выбирает узбекскоязычного исполнителя');

    const customerUserId = 'customer-ru-001';
    const workerUserId = 'worker-uz-002';

    console.log(`👤 Заказчик: ${customerUserId} (русский интерфейс)`);
    console.log(`🔨 Исполнитель: ${workerUserId} (узбекский интерфейс)`);

    // Уведомление исполнителю о выборе
    const workerNotification = await getTranslatedNotification(workerUserId, 'worker_selected', {
      orderTitle: 'Ремонт сантехники в квартире',
      budget: 150000
    });

    console.log('\n📤 Уведомление исполнителю:');
    console.log(`   Заголовок: "${workerNotification.title}"`);
    console.log(`   Текст: "${workerNotification.body}"`);
    console.log(`   Ожидаемый язык: узбекский (но будет русский из-за отсутствия поля в БД)`);

    // Уведомление заказчику о завершении
    const customerNotification = await getTranslatedNotification(customerUserId, 'order_completed', {
      orderTitle: 'Ремонт сантехники в квартире'
    });

    console.log('\n📤 Уведомление заказчику о завершении:');
    console.log(`   Заголовок: "${customerNotification.title}"`);
    console.log(`   Текст: "${customerNotification.body}"`);
    console.log(`   Ожидаемый язык: русский`);

    console.log('\n💡 ВАЖНО: После выполнения SQL скрипта add_preferred_language_column.sql');
    console.log('   и обновления профилей пользователей, уведомления будут приходить');
    console.log('   на правильных языках!');

    return {
      success: true,
      workerNotification,
      customerNotification
    };

  } catch (error) {
    console.error('\n❌ Ошибка симуляции:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
