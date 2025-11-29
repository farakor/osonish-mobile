/**
 * Тест нового формата SMS сообщения
 * Запуск: node test-new-sms-format.js +998548754545
 */

require('dotenv').config();

const testNewSMSFormat = async (phoneNumber) => {
  console.log('📱 Тестирование нового формата SMS...\n');

  if (!phoneNumber) {
    console.error('❌ Укажите номер: node test-new-sms-format.js +998901234567');
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
    console.log('🔐 Аутентификация...');
    const authResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.data?.token) {
      console.error('❌ Ошибка аутентификации:', authData);
      return;
    }

    console.log('✅ Аутентификация успешна');

    // Генерируем код и новое сообщение
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newMessage = `Это тест от Eskiz`;

    console.log(`\n📝 Новый формат сообщения:`);
    console.log(`"${newMessage}"`);
    console.log(`🔢 Код: ${testCode}`);

    // Отправляем SMS
    console.log('\n📤 Отправка SMS...');
    
    const smsResponse = await fetch(`${baseUrl}/message/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.data.token}`,
      },
      body: JSON.stringify({
        mobile_phone: finalPhone,
        message: newMessage,
        from: process.env.SMS_SENDER_NAME || 'OsonIsh'
      }),
    });

    const smsData = await smsResponse.json();
    
    console.log('📊 Ответ сервера:', smsData);

    if (smsResponse.ok && smsData.id) {
      console.log('\n🎉 SMS успешно отправлено!');
      console.log(`📧 ID сообщения: ${smsData.id}`);
      console.log(`📱 Номер: +${finalPhone}`);
      console.log(`🔢 Код: ${testCode}`);
      console.log('\n⏰ Проверьте SMS на указанном номере телефона.');
      
      // Проверяем баланс
      const balanceResponse = await fetch(`${baseUrl}/user/get-limit`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authData.data.token}` },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        console.log(`💰 Оставшийся баланс: ${balanceData.balance} SMS`);
      }

    } else {
      console.error('\n❌ Ошибка отправки SMS:', smsData);
      
      if (smsData.message && smsData.message.includes('модерацию')) {
        console.log('\n📋 Что делать:');
        console.log('1. Зайдите на my.eskiz.uz');
        console.log('2. Перейдите в "СМС" → "Мои тексты"');
        console.log('3. Добавьте новый шаблон:');
        console.log(`   "${newMessage.replace(testCode, '{code}')}"`);
        console.log('4. Дождитесь одобрения');
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

const phoneNumber = process.argv[2];
testNewSMSFormat(phoneNumber);
