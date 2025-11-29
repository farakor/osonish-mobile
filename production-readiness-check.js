/**
 * Комплексная проверка готовности системы к продакшену
 * Проверяет Eskiz.uz, Supabase, конфигурацию и интеграцию
 */

require('dotenv').config();

const checkProductionReadiness = async () => {
  console.log('🔍 ПРОВЕРКА ГОТОВНОСТИ К ПРОДАКШЕНУ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    eskiz: { status: '❌', details: [] },
    supabase: { status: '❌', details: [] },
    configuration: { status: '❌', details: [] },
    integration: { status: '❌', details: [] }
  };

  // 1. ПРОВЕРКА ESKIZ.UZ
  console.log('1️⃣ ПРОВЕРКА ESKIZ.UZ');
  console.log('─────────────────────────────────');
  
  try {
    const eskizEmail = process.env.ESKIZ_EMAIL;
    const eskizPassword = process.env.ESKIZ_PASSWORD;
    const eskizBaseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';

    if (!eskizEmail || !eskizPassword) {
      results.eskiz.details.push('❌ Отсутствуют учетные данные ESKIZ_EMAIL или ESKIZ_PASSWORD');
    } else {
      results.eskiz.details.push('✅ Учетные данные настроены');
      
      // Тестируем подключение
      const authResponse = await fetch(`${eskizBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: eskizEmail, password: eskizPassword }),
      });

      const authData = await authResponse.json();

      if (authResponse.ok && authData.data?.token) {
        results.eskiz.details.push('✅ Аутентификация успешна');
        
        // Проверяем баланс
        const balanceResponse = await fetch(`${eskizBaseUrl}/user/get-limit`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authData.data.token}` },
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          results.eskiz.details.push(`✅ Баланс: ${balanceData.balance || 'неизвестно'} SMS`);
          
          if (balanceData.balance && balanceData.balance < 100) {
            results.eskiz.details.push('⚠️ Низкий баланс - рекомендуется пополнение');
          }
        }

        // Проверяем информацию о пользователе
        const userResponse = await fetch(`${eskizBaseUrl}/auth/user`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${authData.data.token}` },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          results.eskiz.details.push(`✅ Аккаунт: ${userData.email || eskizEmail}`);
          results.eskiz.details.push(`✅ Статус: ${userData.status || 'активен'}`);
        }

        results.eskiz.status = '✅';
      } else {
        results.eskiz.details.push('❌ Ошибка аутентификации: ' + (authData.message || 'неизвестная ошибка'));
      }
    }
  } catch (error) {
    results.eskiz.details.push('❌ Ошибка подключения: ' + error.message);
  }

  // 2. ПРОВЕРКА SUPABASE
  console.log('\n2️⃣ ПРОВЕРКА SUPABASE');
  console.log('─────────────────────────────────');
  
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      results.supabase.details.push('❌ Отсутствуют EXPO_PUBLIC_SUPABASE_URL или EXPO_PUBLIC_SUPABASE_ANON_KEY');
    } else {
      results.supabase.details.push('✅ Учетные данные Supabase настроены');
      results.supabase.details.push(`✅ URL: ${supabaseUrl}`);
      
      // Проверяем подключение к Supabase
      const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (healthResponse.ok || healthResponse.status === 404) {
        results.supabase.details.push('✅ Подключение к Supabase работает');
        
        // Проверяем таблицу users
        const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          }
        });

        if (usersResponse.ok) {
          results.supabase.details.push('✅ Таблица users доступна');
        } else if (usersResponse.status === 401) {
          results.supabase.details.push('⚠️ Нет доступа к таблице users (проверьте RLS политики)');
        } else {
          results.supabase.details.push('❌ Таблица users недоступна');
        }

        results.supabase.status = '✅';
      } else {
        results.supabase.details.push('❌ Ошибка подключения к Supabase');
      }
    }
  } catch (error) {
    results.supabase.details.push('❌ Ошибка Supabase: ' + error.message);
  }

  // 3. ПРОВЕРКА КОНФИГУРАЦИИ
  console.log('\n3️⃣ ПРОВЕРКА КОНФИГУРАЦИИ');
  console.log('─────────────────────────────────');
  
  const smsProvider = 'eskiz'; // Из нашей конфигурации
  const senderName = process.env.SMS_SENDER_NAME || 'OsonIsh';
  
  results.configuration.details.push(`✅ SMS провайдер: ${smsProvider}`);
  results.configuration.details.push(`✅ Имя отправителя: ${senderName}`);
  
  // Проверяем все необходимые переменные
  const requiredVars = [
    'ESKIZ_EMAIL',
    'ESKIZ_PASSWORD', 
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    results.configuration.details.push('✅ Все обязательные переменные окружения настроены');
    results.configuration.status = '✅';
  } else {
    results.configuration.details.push('❌ Отсутствуют переменные: ' + missingVars.join(', '));
  }

  // 4. ПРОВЕРКА ИНТЕГРАЦИИ
  console.log('\n4️⃣ ПРОВЕРКА ИНТЕГРАЦИИ');
  console.log('─────────────────────────────────');
  
  try {
    // Проверяем, что файлы интеграции существуют
    const fs = require('fs');
    const path = require('path');
    
    const integrationFiles = [
      'src/services/eskizSMSService.ts',
      'src/services/supabaseAuthService.ts',
      'src/config/smsConfig.ts',
      'src/utils/smsErrorHandler.ts',
      'src/services/smsServiceInitializer.ts'
    ];

    let filesExist = 0;
    integrationFiles.forEach(file => {
      if (fs.existsSync(path.join(__dirname, file))) {
        filesExist++;
        results.integration.details.push(`✅ ${file}`);
      } else {
        results.integration.details.push(`❌ Отсутствует ${file}`);
      }
    });

    if (filesExist === integrationFiles.length) {
      results.integration.details.push('✅ Все файлы интеграции на месте');
      results.integration.status = '✅';
    } else {
      results.integration.details.push(`❌ Отсутствует ${integrationFiles.length - filesExist} файлов`);
    }

  } catch (error) {
    results.integration.details.push('❌ Ошибка проверки файлов: ' + error.message);
  }

  // ВЫВОД РЕЗУЛЬТАТОВ
  console.log('\n📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ');
  console.log('═══════════════════════════════════════════════════════════');
  
  Object.entries(results).forEach(([category, result]) => {
    console.log(`\n${result.status} ${category.toUpperCase()}`);
    result.details.forEach(detail => console.log(`   ${detail}`));
  });

  // ОБЩИЙ СТАТУС
  const allGreen = Object.values(results).every(r => r.status === '✅');
  
  console.log('\n🎯 ОБЩИЙ СТАТУС ГОТОВНОСТИ');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (allGreen) {
    console.log('🎉 СИСТЕМА ГОТОВА К ПРОДАКШЕНУ!');
    console.log('✅ Все компоненты настроены и работают');
    console.log('📱 Можно переключаться на реальную отправку SMS после одобрения шаблонов');
  } else {
    console.log('⚠️ СИСТЕМА НЕ ПОЛНОСТЬЮ ГОТОВА');
    console.log('🔧 Исправьте отмеченные проблемы перед продакшеном');
  }

  console.log('\n📋 СЛЕДУЮЩИЕ ШАГИ:');
  console.log('1. Добавьте SMS шаблоны в my.eskiz.uz');
  console.log('2. Дождитесь одобрения шаблонов');
  console.log('3. Протестируйте реальную отправку SMS');
  console.log('4. Настройте мониторинг баланса Eskiz');
  console.log('5. Настройте алерты на критические ошибки');

  return allGreen;
};

// Запускаем проверку
checkProductionReadiness().then(isReady => {
  process.exit(isReady ? 0 : 1);
}).catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});
