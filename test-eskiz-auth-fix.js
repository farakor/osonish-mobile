/**
 * Тест исправления аутентификации Eskiz
 * Проверяет, что учетные данные загружаются правильно
 */

const testEskizAuthFix = async () => {
  console.log('🔧 ТЕСТ ИСПРАВЛЕНИЯ АУТЕНТИФИКАЦИИ ESKIZ');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Загружаем конфигурацию
    console.log('1️⃣ ЗАГРУЗКА КОНФИГУРАЦИИ');
    console.log('─────────────────────────────────');
    
    const { loadEnvConfig } = require('./load-env-config.js');
    const envConfig = loadEnvConfig();
    
    console.log('📋 Учетные данные Eskiz:');
    console.log('   Email:', envConfig.ESKIZ_EMAIL || '❌ НЕ НАЙДЕН');
    console.log('   Password:', envConfig.ESKIZ_PASSWORD ? '✅ ЗАГРУЖЕН' : '❌ НЕ НАЙДЕН');
    console.log('   Base URL:', envConfig.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api (по умолчанию)');

    if (!envConfig.ESKIZ_EMAIL || !envConfig.ESKIZ_PASSWORD) {
      console.error('❌ Отсутствуют учетные данные Eskiz в .env файле');
      return;
    }

    // 2. Тестируем аутентификацию
    console.log('\n2️⃣ ТЕСТ АУТЕНТИФИКАЦИИ');
    console.log('─────────────────────────────────');
    
    const eskizConfig = {
      email: envConfig.ESKIZ_EMAIL,
      password: envConfig.ESKIZ_PASSWORD,
      baseUrl: envConfig.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api'
    };

    console.log('🔐 Попытка аутентификации в Eskiz API...');
    
    const authResponse = await fetch(`${eskizConfig.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: eskizConfig.email,
        password: eskizConfig.password
      }),
    });

    console.log('📊 Статус ответа:', authResponse.status);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      
      if (authData.data && authData.data.token) {
        console.log('✅ АУТЕНТИФИКАЦИЯ УСПЕШНА!');
        console.log('🔑 Токен получен:', authData.data.token.substring(0, 20) + '...');
        
        // Проверяем баланс
        console.log('\n💰 Проверка баланса...');
        const balanceResponse = await fetch(`${eskizConfig.baseUrl}/user/get-limit`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authData.data.token}` },
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          console.log('✅ Баланс:', balanceData.balance || 'неизвестно', 'SMS');
        }

        console.log('\n🎉 ПРОБЛЕМА РЕШЕНА!');
        console.log('✅ Учетные данные правильные');
        console.log('✅ Аутентификация работает');
        console.log('✅ Приложение должно отправлять SMS');
        
      } else {
        console.error('❌ Неверный формат ответа:', authData);
      }
    } else {
      const errorData = await authResponse.json();
      console.error('❌ ОШИБКА АУТЕНТИФИКАЦИИ:', errorData);
      
      if (authResponse.status === 401) {
        console.log('\n🔧 ВОЗМОЖНЫЕ ПРИЧИНЫ:');
        console.log('1. Неверный email или пароль');
        console.log('2. Аккаунт заблокирован');
        console.log('3. Проблемы с API Eskiz');
        console.log('\n📋 РЕКОМЕНДАЦИИ:');
        console.log('1. Проверьте учетные данные в my.eskiz.uz');
        console.log('2. Обновите пароль в .env файле');
        console.log('3. Свяжитесь с поддержкой Eskiz');
      }
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
};

testEskizAuthFix();
