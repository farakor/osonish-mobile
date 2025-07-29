#!/usr/bin/env node

/**
 * Скрипт для очистки всех пользовательских данных в приложении Osonish
 * 
 * Использование:
 * node clearData.js
 * 
 * Внимание: Этот скрипт удаляет ВСЕ данные из AsyncStorage!
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🧹 Скрипт очистки данных приложения Osonish\n');
  
  console.log('Этот скрипт удалит следующие данные:');
  console.log('- Всех пользователей и данные авторизации');
  console.log('- Все заявки и заказы');
  console.log('- Временные данные профиля');
  console.log('- Любые другие данные приложения в AsyncStorage\n');
  
  const answer = await askQuestion('Вы уверены, что хотите продолжить? (да/нет): ');
  
  if (answer.toLowerCase() !== 'да' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('Операция отменена.');
    rl.close();
    return;
  }
  
  console.log('\n⚠️  ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ!');
  const finalAnswer = await askQuestion('Введите "УДАЛИТЬ ВСЕ" для подтверждения: ');
  
  if (finalAnswer !== 'УДАЛИТЬ ВСЕ') {
    console.log('Операция отменена.');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Инструкции для очистки данных:\n');
  
  console.log('1. Откройте мобильное приложение в симуляторе или на устройстве');
  console.log('2. Добавьте временно в навигацию экран разработчика:');
  console.log('   - Откройте файл: src/navigation/AppNavigator.tsx');
  console.log('   - Добавьте импорт: import { DevScreen } from "../screens/shared/DevScreen";');
  console.log('   - Добавьте экран в навигатор');
  console.log('3. Перейдите на экран "Панель разработчика"');
  console.log('4. Нажмите "Обновить статистику" чтобы увидеть текущие данные');
  console.log('5. Нажмите "Удалить ВСЕ данные" и подтвердите');
  console.log('6. Проверьте что статистика показывает 0 пользователей и заявок\n');
  
  console.log('Альтернативный способ через код:');
  console.log('- Добавьте в любой экран: import { clearAllUserData } from "../utils/clearAllData";');
  console.log('- Вызовите функцию: await clearAllUserData();\n');
  
  console.log('📁 Файлы для работы с данными:');
  console.log('- Утилита очистки: src/utils/clearAllData.ts');
  console.log('- Экран разработчика: src/screens/shared/DevScreen.tsx');
  console.log('- Сервис пользователей: src/services/authService.ts');
  console.log('- Сервис заказов: src/services/orderService.ts\n');
  
  console.log('✅ Готово! Следуйте инструкциям выше для очистки данных.');
  
  rl.close();
}

main().catch(console.error); 