/**
 * Простое переключение режима SMS в коде приложения
 * Изменяет переменную FORCE_PRODUCTION_SMS в файле smsMode.ts
 */

const fs = require('fs');
const path = require('path');

const toggleSMSModeSimple = (mode) => {
  console.log('🔄 ПРОСТОЕ ПЕРЕКЛЮЧЕНИЕ РЕЖИМА SMS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!mode || !['dev', 'prod', 'production', 'development'].includes(mode)) {
    console.log('❌ Укажите режим:');
    console.log('   node toggle-sms-mode-simple.js dev   # Коды в консоль');
    console.log('   node toggle-sms-mode-simple.js prod  # Реальные SMS');
    process.exit(1);
  }

  const smsModePath = path.join(__dirname, 'src/config/smsMode.js');
  const isProduction = ['prod', 'production'].includes(mode);

  try {
    if (!fs.existsSync(smsModePath)) {
      console.error('❌ Файл src/config/smsMode.ts не найден');
      process.exit(1);
    }

    // Читаем файл
    let content = fs.readFileSync(smsModePath, 'utf8');
    
    // Заменяем значение FORCE_PRODUCTION_SMS
    const regex = /const FORCE_PRODUCTION_SMS = (true|false);/;
    const newValue = `const FORCE_PRODUCTION_SMS = ${isProduction};`;
    
    if (regex.test(content)) {
      content = content.replace(regex, newValue);
      
      // Записываем обратно
      fs.writeFileSync(smsModePath, content);
      
      if (isProduction) {
        console.log('🚀 ВКЛЮЧЕН РЕЖИМ РЕАЛЬНЫХ SMS');
        console.log('📱 SMS будут отправляться через Eskiz.uz');
        console.log('💰 Каждый SMS тратит баланс');
        console.log('⚠️ Убедитесь, что у вас достаточно средств!');
      } else {
        console.log('🧪 ВКЛЮЧЕН РЕЖИМ РАЗРАБОТКИ');
        console.log('📺 SMS коды будут выводиться в консоль');
        console.log('💰 Баланс Eskiz не тратится');
      }
      
      console.log('\n✅ Режим успешно изменен!');
      console.log('🔄 Перезапустите приложение (Ctrl+C, затем npm start)');
      
      console.log('\n📋 ИЗМЕНЕНИЯ В КОДЕ:');
      console.log(`   src/config/smsMode.js: FORCE_PRODUCTION_SMS = ${isProduction}`);
      
    } else {
      console.error('❌ Не удалось найти переменную FORCE_PRODUCTION_SMS в файле');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

// Запускаем с аргументом из командной строки
const mode = process.argv[2];
toggleSMSModeSimple(mode);
