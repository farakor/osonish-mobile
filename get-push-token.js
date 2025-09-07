#!/usr/bin/env node

/**
 * Скрипт для получения push токена из приложения
 * Использование: node get-push-token.js
 */

console.log('🔍 Поиск push токена в приложении...');
console.log('');
console.log('📱 В приложении выполните в консоли:');
console.log('   notificationService.getCurrentPushToken()');
console.log('');
console.log('📋 Или найдите в логах строку:');
console.log('   [NotificationService] ✅ Push token получен: ExponentPushToken[...]');
console.log('');
console.log('🧪 После получения токена используйте:');
console.log('   npm run test-notifications "ExponentPushToken[ваш-полный-токен]"');
console.log('');

// Альтернативный способ - через Expo CLI
console.log('🚀 Альтернативно, используйте Expo Push Tool:');
console.log('   npx expo send-notification --to="ExponentPushToken[токен]" --title="Тест" --body="Тестовое сообщение"');
console.log('');
