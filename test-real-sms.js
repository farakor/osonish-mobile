/**
 * Скрипт для тестирования реальной отправки SMS через Eskiz.uz
 * Запуск: node test-real-sms.js +998901234567
 */

require('dotenv').config();

const testRealSMS = async (phoneNumber) => {
  console.log('📱 Тестирование реальной отправки SMS через Eskiz.uz...\n');

  if (!phoneNumber) {
    console.error('❌ Ошибка: Укажите номер телефона');
    console.log('Использование: node test-real-sms.js +998901234567');
    process.exit(1);
  }

  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';
  const senderName = process.env.SMS_SENDER_NAME || 'OsonIsh';

  console.log('📋 Конфигурация:');
  console.log(`Номер: ${phoneNumber}`);
  console.log(`Отправитель: ${senderName}`);
  console.log(`Email: ${email}\n`);

  try {
    // Форматируем номер телефона
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    let finalPhone = formattedPhone;
    
    if (formattedPhone.startsWith('998')) {
      finalPhone = formattedPhone;
    } else if (formattedPhone.startsWith('8') && formattedPhone.length === 10) {
      finalPhone = '998' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('9') && formattedPhone.length === 9) {
      finalPhone = '998' + formattedPhone;
    }

    console.log(`📞 Форматированный номер: ${finalPhone}`);

    // Аутентификация
    console.log('🔐 Аутентификация...');
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.data?.token) {
      console.error('❌ Ошибка аутентификации:', authData);
      return;
    }

    console.log('✅ Аутентификация успешна');

    // Генерируем тестовый код
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `Ваш код подтверждения для Oson Ish: ${testCode}. Не сообщайте этот код никому.`;

    console.log(`📝 Сообщение: ${message}`);
    console.log(`🔢 Тестовый код: ${testCode}`);

    // Отправляем SMS
    console.log('\n📤 Отправка SMS...');
    
    const smsPayload = {
      mobile_phone: finalPhone,
      message: message,
      from: senderName
    };

    const smsResponse = await fetch(`${baseUrl}/message/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.data.token}`,
      },
      body: JSON.stringify(smsPayload),
    });

    const smsData = await smsResponse.json();

    console.log('📊 Ответ сервера:', smsData);

    if (smsResponse.ok && smsData.id) {
      console.log('\n🎉 SMS успешно отправлено!');
      console.log(`📧 ID сообщения: ${smsData.id}`);
      console.log(`📱 Номер: +${finalPhone}`);
      console.log(`🔢 Код: ${testCode}`);
      console.log('\n⏰ Проверьте SMS на указанном номере телефона.');
      
      // Проверяем баланс после отправки
      const balanceResponse = await fetch(`${baseUrl}/user/get-limit`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.data.token}`,
        },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log(`💰 Оставшийся баланс: ${balanceData.balance} SMS`);
      }

    } else {
      console.error('❌ Ошибка отправки SMS:', smsData);
      
      // Анализируем ошибку
      if (smsData.message) {
        console.log('\n🔍 Возможные причины:');
        if (smsData.message.includes('balance')) {
          console.log('- Недостаточно средств на балансе');
        }
        if (smsData.message.includes('sender')) {
          console.log('- Имя отправителя не одобрено');
        }
        if (smsData.message.includes('phone')) {
          console.log('- Неверный формат номера телефона');
        }
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

// Получаем номер телефона из аргументов командной строки
const phoneNumber = process.argv[2];
testRealSMS(phoneNumber);
