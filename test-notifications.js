#!/usr/bin/env node

/**
 * Скрипт для тестирования push уведомлений
 * Использование: node test-notifications.js [push-token]
 */

const https = require('https');

// Функция для отправки push уведомления через Expo
async function sendPushNotification(pushToken, title = 'Тест уведомления', body = 'Это тестовое уведомление из скрипта') {
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: {
      test: true,
      timestamp: Date.now()
    },
    priority: 'high',
    channelId: 'default',
  };

  const postData = JSON.stringify(message);

  const options = {
    hostname: 'exp.host',
    port: 443,
    path: '/--/api/v2/push/send',
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error('Ошибка парсинга ответа: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Основная функция
async function main() {
  const pushToken = process.argv[2];

  if (!pushToken) {
    console.log('❌ Ошибка: Не указан push token');
    console.log('');
    console.log('Использование:');
    console.log('  node test-notifications.js ExponentPushToken[xxxxxx]');
    console.log('');
    console.log('Где взять push token:');
    console.log('  1. Запустите приложение в Expo Go или на устройстве');
    console.log('  2. Найдите в логах строку: "✅ Push token получен: ExponentPushToken[...]"');
    console.log('  3. Скопируйте весь токен включая ExponentPushToken[...]');
    console.log('');
    process.exit(1);
  }

  if (!pushToken.startsWith('ExponentPushToken[')) {
    console.log('❌ Ошибка: Неверный формат push token');
    console.log('Push token должен начинаться с "ExponentPushToken["');
    console.log('');
    process.exit(1);
  }

  console.log('🚀 Отправка тестового уведомления...');
  console.log('📱 Push token:', pushToken.substring(0, 30) + '...');
  console.log('');

  try {
    const result = await sendPushNotification(pushToken);
    
    console.log('📡 Ответ от Expo сервера:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.data && result.data.length > 0) {
      const status = result.data[0].status;
      const details = result.data[0].details;

      if (status === 'ok') {
        console.log('✅ Уведомление успешно отправлено!');
        console.log('💡 Проверьте устройство - уведомление должно появиться в течение нескольких секунд');
      } else if (status === 'error') {
        console.log('❌ Ошибка отправки уведомления:');
        console.log('   Детали:', details);
        
        if (details && details.error === 'DeviceNotRegistered') {
          console.log('💡 Возможные причины:');
          console.log('   - Приложение удалено с устройства');
          console.log('   - Push token устарел');
          console.log('   - Устройство не подключено к интернету');
        }
      }
    }

  } catch (error) {
    console.log('❌ Ошибка:', error.message);
    console.log('');
    console.log('💡 Возможные причины:');
    console.log('   - Проблемы с интернет соединением');
    console.log('   - Неверный push token');
    console.log('   - Проблемы с Expo сервером');
  }
}

// Запуск скрипта
main().catch(console.error);
