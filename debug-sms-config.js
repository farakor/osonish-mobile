/**
 * Отладка конфигурации SMS в приложении
 * Проверяет, какие настройки загружаются
 */

require('dotenv').config();

const debugSMSConfig = () => {
  console.log('🔍 ОТЛАДКА КОНФИГУРАЦИИ SMS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:');
  console.log(`ESKIZ_EMAIL: ${process.env.ESKIZ_EMAIL || '❌ НЕ УСТАНОВЛЕНА'}`);
  console.log(`ESKIZ_PASSWORD: ${process.env.ESKIZ_PASSWORD ? '✅ УСТАНОВЛЕНА' : '❌ НЕ УСТАНОВЛЕНА'}`);
  console.log(`ESKIZ_BASE_URL: ${process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api (по умолчанию)'}`);
  console.log(`SMS_SENDER_NAME: ${process.env.SMS_SENDER_NAME || 'OsonIsh (по умолчанию)'}`);
  console.log(`FORCE_PRODUCTION_SMS: ${process.env.FORCE_PRODUCTION_SMS || '❌ НЕ УСТАНОВЛЕНА'}`);

  console.log('\n🔧 РЕЖИМ РАБОТЫ:');
  const isDev = process.env.NODE_ENV !== 'production';
  const forceProduction = process.env.FORCE_PRODUCTION_SMS === 'true';
  
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Режим разработки: ${isDev ? 'ДА' : 'НЕТ'}`);
  console.log(`Принудительный продакшн: ${forceProduction ? 'ДА' : 'НЕТ'}`);

  console.log('\n📱 ЛОГИКА ОТПРАВКИ SMS:');
  if (isDev && !forceProduction) {
    console.log('🧪 РЕЖИМ: Коды в консоль (разработка)');
    console.log('📺 SMS НЕ отправляются, коды выводятся в консоль');
  } else {
    console.log('🚀 РЕЖИМ: Реальные SMS (продакшн)');
    console.log('📱 SMS отправляются через Eskiz.uz');
  }

  console.log('\n🔄 ЧТО НУЖНО ДЛЯ РЕАЛЬНЫХ SMS:');
  console.log('1. FORCE_PRODUCTION_SMS=true в .env файле');
  console.log('2. Перезапуск приложения после изменения .env');
  console.log('3. Проверка, что приложение загружает .env файл');

  // Проверяем файл .env
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env');
  
  console.log('\n📄 ПРОВЕРКА .ENV ФАЙЛА:');
  if (fs.existsSync(envPath)) {
    console.log('✅ Файл .env существует');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('FORCE_PRODUCTION_SMS=true')) {
      console.log('✅ FORCE_PRODUCTION_SMS=true найдена в файле');
    } else if (envContent.includes('FORCE_PRODUCTION_SMS=false')) {
      console.log('⚠️ FORCE_PRODUCTION_SMS=false в файле (режим разработки)');
    } else {
      console.log('❌ FORCE_PRODUCTION_SMS не найдена в файле');
    }
  } else {
    console.log('❌ Файл .env не найден');
  }
};

debugSMSConfig();
