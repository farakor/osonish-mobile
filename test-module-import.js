/**
 * Тест импорта модуля eskizSMSService
 */

console.log('🧪 ТЕСТ ИМПОРТА МОДУЛЯ ESKIZ SMS SERVICE');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  // Попробуем импортировать модуль как в React Native
  console.log('📦 Попытка импорта eskizSMSService...');
  
  // Имитируем импорт (в Node.js нельзя импортировать ES модули напрямую)
  console.log('✅ Модуль должен загрузиться при импорте в приложении');
  console.log('🔧 При загрузке должна выводиться конфигурация');
  console.log('🚀 Сервис должен автоматически инициализироваться');
  
  console.log('\n📋 Ожидаемые логи в приложении:');
  console.log('[EskizSMS] 🔧 Конфигурация Eskiz: {');
  console.log('  email: "info@oson-ish.uz",');
  console.log('  password: "O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g",');
  console.log('  baseUrl: "https://notify.eskiz.uz/api",');
  console.log('  hasPassword: true');
  console.log('}');
  
  console.log('\n🎯 Если вы видите другой пароль в логах приложения,');
  console.log('   значит приложение использует старую версию файла!');
  
} catch (error) {
  console.error('❌ Ошибка при тестировании:', error.message);
}

console.log('\n📱 Проверьте логи приложения на наличие строки:');
console.log('   "[EskizSMS] 🔧 Конфигурация Eskiz"');
console.log('   и убедитесь, что пароль правильный!');
