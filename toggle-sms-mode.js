/**
 * Утилита для переключения между режимами SMS
 * Позволяет быстро включать/выключать реальные SMS
 */

const fs = require('fs');
const path = require('path');

const toggleSMSMode = (mode) => {
  console.log('🔄 ПЕРЕКЛЮЧЕНИЕ РЕЖИМА SMS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!mode || !['dev', 'prod', 'production', 'development'].includes(mode)) {
    console.log('❌ Укажите режим:');
    console.log('   node toggle-sms-mode.js dev        # Коды в консоль');
    console.log('   node toggle-sms-mode.js prod       # Реальные SMS');
    console.log('   node toggle-sms-mode.js production # Реальные SMS');
    process.exit(1);
  }

  const envPath = path.join(__dirname, '.env');
  const isProduction = ['prod', 'production'].includes(mode);

  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const forceProductionRegex = /^FORCE_PRODUCTION_SMS=.*$/m;
    
    if (isProduction) {
      // Включаем реальные SMS
      if (forceProductionRegex.test(envContent)) {
        envContent = envContent.replace(forceProductionRegex, 'FORCE_PRODUCTION_SMS=true');
      } else {
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += '\n# Принудительное включение реальных SMS\nFORCE_PRODUCTION_SMS=true\n';
      }
      
      console.log('🚀 ВКЛЮЧЕН РЕЖИМ РЕАЛЬНЫХ SMS');
      console.log('📱 SMS будут отправляться через Eskiz.uz');
      console.log('⚠️ Убедитесь, что у вас достаточно баланса!');
      
    } else {
      // Включаем режим разработки
      if (forceProductionRegex.test(envContent)) {
        envContent = envContent.replace(forceProductionRegex, 'FORCE_PRODUCTION_SMS=false');
      } else {
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n';
        }
        envContent += '\n# Принудительное включение реальных SMS\nFORCE_PRODUCTION_SMS=false\n';
      }
      
      console.log('🧪 ВКЛЮЧЕН РЕЖИМ РАЗРАБОТКИ');
      console.log('📺 SMS коды будут выводиться в консоль');
      console.log('💰 Баланс Eskiz не тратится');
    }

    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Режим успешно изменен!');
    console.log('🔄 Перезапустите приложение для применения изменений');
    
    // Показываем текущий статус
    console.log('\n📊 ТЕКУЩИЕ НАСТРОЙКИ:');
    console.log(`   Режим SMS: ${isProduction ? 'ПРОДАКШН (реальные SMS)' : 'РАЗРАБОТКА (коды в консоль)'}`);
    console.log(`   Переменная: FORCE_PRODUCTION_SMS=${isProduction}`);
    
    if (isProduction) {
      console.log('\n⚠️ ВНИМАНИЕ:');
      console.log('• Реальные SMS будут отправляться на все номера');
      console.log('• Проверьте баланс в Eskiz.uz');
      console.log('• Тестируйте только на своих номерах');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

// Запускаем с аргументом из командной строки
const mode = process.argv[2];
toggleSMSMode(mode);
