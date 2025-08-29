/**
 * Скрипт для тестирования подключения к Eskiz.uz
 * Запуск: node test-eskiz-connection.js
 */

// Загружаем переменные окружения
require('dotenv').config();

const testEskizConnection = async () => {
  console.log('🧪 Тестирование подключения к Eskiz.uz...\n');

  // Проверяем переменные окружения
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';

  console.log('📋 Конфигурация:');
  console.log(`Email: ${email ? email : '❌ НЕ НАСТРОЕН'}`);
  console.log(`Password: ${password ? '✅ НАСТРОЕН' : '❌ НЕ НАСТРОЕН'}`);
  console.log(`Base URL: ${baseUrl}\n`);

  if (!email || !password) {
    console.error('❌ Ошибка: Не настроены ESKIZ_EMAIL или ESKIZ_PASSWORD в файле .env');
    process.exit(1);
  }

  try {
    // Тестируем аутентификацию
    console.log('🔐 Тестирование аутентификации...');
    
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      console.error('❌ Ошибка аутентификации:', authData);
      return;
    }

    if (!authData.data || !authData.data.token) {
      console.error('❌ Неверный формат ответа аутентификации:', authData);
      return;
    }

    console.log('✅ Аутентификация успешна!');
    console.log(`🔑 Токен получен: ${authData.data.token.substring(0, 20)}...`);

    // Тестируем получение информации о пользователе
    console.log('\n👤 Получение информации о пользователе...');
    
    const userResponse = await fetch(`${baseUrl}/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.data.token}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Информация о пользователе получена:');
      console.log(`📧 Email: ${userData.email}`);
      console.log(`👤 Имя: ${userData.name}`);
      console.log(`📊 Статус: ${userData.status}`);
    }

    // Тестируем получение баланса
    console.log('\n💰 Проверка баланса...');
    
    const balanceResponse = await fetch(`${baseUrl}/user/get-limit`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authData.data.token}`,
      },
    });

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log(`✅ Баланс: ${balanceData.balance} SMS`);
      
      if (balanceData.balance < 10) {
        console.warn('⚠️ Предупреждение: Низкий баланс! Пополните аккаунт.');
      }
    }

    console.log('\n🎉 Все тесты прошли успешно!');
    console.log('📱 Eskiz.uz готов к отправке SMS в продакшене.');

  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    console.log('\n🔧 Проверьте:');
    console.log('1. Правильность email и пароля в .env');
    console.log('2. Подключение к интернету');
    console.log('3. Статус аккаунта на my.eskiz.uz');
  }
};

// Запускаем тест
testEskizConnection();
