/**
 * Тест с простым SMS текстом (без специальных символов)
 * Запуск: node test-simple-sms.js +998901234567
 */

require('dotenv').config();

const testSimpleSMS = async (phoneNumber) => {
  console.log('📱 Тестирование простого SMS...\n');

  if (!phoneNumber) {
    console.error('❌ Укажите номер: node test-simple-sms.js +998901234567');
    process.exit(1);
  }

  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';

  try {
    // Форматируем номер
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    let finalPhone = formattedPhone;
    
    if (formattedPhone.startsWith('998')) {
      finalPhone = formattedPhone;
    } else if (formattedPhone.startsWith('8') && formattedPhone.length === 10) {
      finalPhone = '998' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('9') && formattedPhone.length === 9) {
      finalPhone = '998' + formattedPhone;
    }

    console.log(`📞 Номер: ${finalPhone}`);

    // Аутентификация
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.data?.token) {
      console.error('❌ Ошибка аутентификации');
      return;
    }

    // Простые тестовые сообщения
    const testMessages = [
      'Test message from Oson Ish',
      'Kod: 123456',
      'Your code 123456',
      'Test SMS'
    ];

    for (const message of testMessages) {
      console.log(`\n📝 Тестируем: "${message}"`);
      
      const smsResponse = await fetch(`${baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.data.token}`,
        },
        body: JSON.stringify({
          mobile_phone: finalPhone,
          message: message,
          from: '4546' // Используем числовой отправитель
        }),
      });

      const smsData = await smsResponse.json();
      
      if (smsResponse.ok && smsData.id) {
        console.log(`✅ Отправлено! ID: ${smsData.id}`);
        console.log('📱 Проверьте SMS на телефоне');
        break; // Если одно сообщение прошло, останавливаемся
      } else {
        console.log(`❌ Ошибка: ${smsData.message || 'Неизвестная ошибка'}`);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

const phoneNumber = process.argv[2];
testSimpleSMS(phoneNumber);
