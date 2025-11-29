/**
 * 🧪 Тестовый скрипт для проверки push-уведомлений
 * Запуск: node test-push-notifications.js
 */

const EXPO_PUSH_TOKEN = 'YOUR_EXPO_PUSH_TOKEN_HERE'; // Замените на реальный токен

async function testPushNotification() {
  const message = {
    to: EXPO_PUSH_TOKEN,
    sound: 'default',
    title: '🧪 Тестовое уведомление',
    body: 'Firebase FCM интеграция работает! 🎉',
    data: {
      screen: 'test',
      timestamp: Date.now()
    },
  };

  try {
    console.log('📤 Отправляем тестовое push-уведомление...');
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Push-уведомление отправлено успешно!');
      console.log('📋 Результат:', result);
    } else {
      console.error('❌ Ошибка отправки:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Запуск теста
if (EXPO_PUSH_TOKEN === 'YOUR_EXPO_PUSH_TOKEN_HERE') {
  console.log('⚠️  Замените YOUR_EXPO_PUSH_TOKEN_HERE на реальный токен из приложения');
  console.log('💡 Токен можно получить из логов приложения после авторизации');
} else {
  testPushNotification();
}