/**
 * Скрипт для включения реальной отправки SMS в приложении
 * Добавляет переменную FORCE_PRODUCTION_SMS=true в .env
 */

const fs = require('fs');
const path = require('path');

const enableProductionSMS = () => {
  console.log('🚀 ВКЛЮЧЕНИЕ РЕАЛЬНЫХ SMS В ПРИЛОЖЕНИИ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const envPath = path.join(__dirname, '.env');
  
  try {
    // Читаем существующий .env файл
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Найден существующий .env файл');
    } else {
      console.log('⚠️ Файл .env не найден, создаем новый');
    }

    // Проверяем, есть ли уже переменная FORCE_PRODUCTION_SMS
    const forceProductionRegex = /^FORCE_PRODUCTION_SMS=.*$/m;
    
    if (forceProductionRegex.test(envContent)) {
      // Обновляем существующую переменную
      envContent = envContent.replace(forceProductionRegex, 'FORCE_PRODUCTION_SMS=true');
      console.log('🔄 Обновлена существующая переменная FORCE_PRODUCTION_SMS');
    } else {
      // Добавляем новую переменную
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += '\n# Принудительное включение реальных SMS (даже в dev режиме)\nFORCE_PRODUCTION_SMS=true\n';
      console.log('➕ Добавлена новая переменная FORCE_PRODUCTION_SMS');
    }

    // Записываем обновленный .env файл
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ РЕАЛЬНЫЕ SMS ВКЛЮЧЕНЫ!');
    console.log('📋 Что изменилось:');
    console.log('   • Добавлена переменная FORCE_PRODUCTION_SMS=true');
    console.log('   • Приложение будет отправлять реальные SMS даже в dev режиме');
    console.log('   • SMS коды больше не будут выводиться в консоль');
    
    console.log('\n🔄 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Перезапустите приложение (npm start)');
    console.log('2. Протестируйте регистрацию/вход');
    console.log('3. SMS должны приходить на реальные номера');
    
    console.log('\n⚠️ ВАЖНО:');
    console.log('• Убедитесь, что у вас достаточно баланса в Eskiz');
    console.log('• Тестируйте только на своих номерах');
    console.log('• В продакшене эта переменная не нужна');

    console.log('\n🔧 ДЛЯ ОТКЛЮЧЕНИЯ:');
    console.log('Измените FORCE_PRODUCTION_SMS=false или удалите эту строку из .env');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n🔧 Попробуйте:');
    console.log('1. Проверить права доступа к файлу .env');
    console.log('2. Создать файл .env вручную');
    console.log('3. Добавить строку: FORCE_PRODUCTION_SMS=true');
  }
};

// Запускаем скрипт
enableProductionSMS();
