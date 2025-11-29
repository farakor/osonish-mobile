/**
 * Утилита для переключения на реальную отправку SMS
 * Тестирует отправку реального SMS через одобренный шаблон
 */

require('dotenv').config();

const switchToProductionSMS = async (testPhone) => {
  console.log('🚀 ПЕРЕКЛЮЧЕНИЕ НА РЕАЛЬНЫЕ SMS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!testPhone) {
    console.error('❌ Укажите номер для тестирования: node switch-to-production-sms.js +998977037942');
    process.exit(1);
  }

  const eskizEmail = process.env.ESKIZ_EMAIL;
  const eskizPassword = process.env.ESKIZ_PASSWORD;
  const eskizBaseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';
  const senderName = process.env.SMS_SENDER_NAME || 'OsonIsh';

  try {
    // Форматируем номер
    const formattedPhone = testPhone.replace(/\D/g, '');
    let finalPhone = formattedPhone;
    
    if (formattedPhone.startsWith('998')) {
      finalPhone = formattedPhone;
    } else if (formattedPhone.startsWith('8') && formattedPhone.length === 10) {
      finalPhone = '998' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('9') && formattedPhone.length === 9) {
      finalPhone = '998' + formattedPhone;
    }

    console.log(`📞 Тестовый номер: ${testPhone}`);
    console.log(`📞 Форматированный: ${finalPhone}`);

    // Аутентификация в Eskiz
    console.log('\n🔐 Аутентификация в Eskiz...');
    const authResponse = await fetch(`${eskizBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: eskizEmail, password: eskizPassword }),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.data?.token) {
      throw new Error('Ошибка аутентификации: ' + (authData.message || 'неизвестная ошибка'));
    }

    console.log('✅ Аутентификация успешна');

    // Проверяем баланс
    console.log('\n💰 Проверка баланса...');
    const balanceResponse = await fetch(`${eskizBaseUrl}/user/get-limit`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authData.data.token}` },
    });

    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log(`✅ Баланс: ${balanceData.balance || 'неизвестно'} SMS`);
      
      if (balanceData.balance && balanceData.balance < 10) {
        console.warn('⚠️ Низкий баланс! Рекомендуется пополнение.');
      }
    }

    // Генерируем тестовый код и отправляем реальный SMS
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const smsMessage = `${testCode} - Код подтверждения авторизации в приложении Oson Ish`;

    console.log(`\n📝 Отправляем реальный SMS:`);
    console.log(`📱 Номер: +${finalPhone}`);
    console.log(`💬 Сообщение: "${smsMessage}"`);
    console.log(`🔢 Код: ${testCode}`);
    console.log(`📤 Отправитель: ${senderName}`);

    // ОТПРАВЛЯЕМ РЕАЛЬНЫЙ SMS
    console.log('\n🚀 ОТПРАВКА РЕАЛЬНОГО SMS...');
    
    const smsResponse = await fetch(`${eskizBaseUrl}/message/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.data.token}`,
      },
      body: JSON.stringify({
        mobile_phone: finalPhone,
        message: smsMessage,
        from: senderName
      }),
    });

    const smsData = await smsResponse.json();
    
    console.log('📊 Ответ Eskiz:', smsData);

    if (smsResponse.ok && smsData.id) {
      console.log('\n🎉 РЕАЛЬНЫЙ SMS УСПЕШНО ОТПРАВЛЕН!');
      console.log(`📧 ID сообщения: ${smsData.id}`);
      console.log(`📱 Номер получателя: +${finalPhone}`);
      console.log(`🔢 Код в SMS: ${testCode}`);
      console.log(`⏰ Проверьте SMS на указанном номере!`);
      
      // Проверяем баланс после отправки
      const newBalanceResponse = await fetch(`${eskizBaseUrl}/user/get-limit`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authData.data.token}` },
      });

      if (newBalanceResponse.ok) {
        const newBalanceData = await newBalanceResponse.json();
        console.log(`💰 Баланс после отправки: ${newBalanceData.balance} SMS`);
      }

      console.log('\n✅ СИСТЕМА ГОТОВА К ПРОДАКШЕНУ!');
      console.log('🔄 Теперь нужно обновить код приложения для отправки реальных SMS');

    } else {
      console.error('\n❌ ОШИБКА ОТПРАВКИ SMS:', smsData);
      
      if (smsData.message) {
        console.log('\n🔍 Анализ ошибки:');
        if (smsData.message.includes('модерацию')) {
          console.log('❌ Текст еще не прошел модерацию');
          console.log('📋 Убедитесь, что шаблон одобрен в my.eskiz.uz');
        }
        if (smsData.message.includes('balance')) {
          console.log('❌ Недостаточно средств на балансе');
        }
        if (smsData.message.includes('sender')) {
          console.log('❌ Проблема с именем отправителя');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
};

// Запускаем тест
const phoneNumber = process.argv[2];
switchToProductionSMS(phoneNumber);
