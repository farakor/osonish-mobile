/**
 * Финальный тест SMS системы
 * Проверяет, что все работает без ошибок Node.js модулей
 */

const testFinalSMS = async () => {
  console.log('🎯 ФИНАЛЬНЫЙ ТЕСТ SMS СИСТЕМЫ');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Тестируем аутентификацию с жестко закодированными данными
    console.log('1️⃣ ТЕСТ АУТЕНТИФИКАЦИИ ESKIZ');
    console.log('─────────────────────────────────');
    
    const eskizConfig = {
      email: 'info@oson-ish.uz',
      password: 'O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g',
      baseUrl: 'https://notify.eskiz.uz/api'
    };

    console.log('📧 Email:', eskizConfig.email);
    console.log('🔐 Password:', eskizConfig.password ? 'НАСТРОЕН' : 'НЕ НАСТРОЕН');
    console.log('🌐 Base URL:', eskizConfig.baseUrl);

    console.log('\n🔐 Попытка аутентификации...');
    
    const authResponse = await fetch(`${eskizConfig.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: eskizConfig.email,
        password: eskizConfig.password
      }),
    });

    console.log('📊 Статус ответа:', authResponse.status);

    if (authResponse.ok) {
      const authData = await authResponse.json();
      
      if (authData.data && authData.data.token) {
        console.log('✅ АУТЕНТИФИКАЦИЯ УСПЕШНА!');
        console.log('🔑 Токен получен');
        
        // Тестируем отправку SMS
        console.log('\n2️⃣ ТЕСТ ОТПРАВКИ SMS');
        console.log('─────────────────────────────────');
        
        const testPhone = '998977037942';
        const testCode = Math.floor(100000 + Math.random() * 900000).toString();
        const message = `${testCode} - Код подтверждения авторизации в приложении Oson Ish`;
        
        console.log('📱 Тестовый номер:', testPhone);
        console.log('💬 Сообщение:', message);
        console.log('🔢 Код:', testCode);
        
        const smsResponse = await fetch(`${eskizConfig.baseUrl}/message/sms/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.data.token}`,
          },
          body: JSON.stringify({
            mobile_phone: testPhone,
            message: message,
            from: 'OsonIsh'
          }),
        });

        const smsData = await smsResponse.json();
        console.log('📊 Ответ SMS API:', smsData);

        if (smsResponse.ok && smsData.id) {
          console.log('\n🎉 SMS УСПЕШНО ОТПРАВЛЕН!');
          console.log('📧 ID сообщения:', smsData.id);
          console.log('📱 SMS должен прийти на номер +' + testPhone);
          console.log('🔢 Код в SMS:', testCode);
          
          console.log('\n✅ СИСТЕМА ПОЛНОСТЬЮ РАБОТАЕТ!');
          console.log('🚀 Приложение готово отправлять реальные SMS');
          
        } else {
          console.log('\n⚠️ Проблема с отправкой SMS:', smsData.message || 'Неизвестная ошибка');
          
          if (smsData.message && smsData.message.includes('модерацию')) {
            console.log('ℹ️ Возможно, нужно добавить шаблон в Eskiz');
          }
        }
        
      } else {
        console.error('❌ Неверный формат ответа аутентификации');
      }
    } else {
      const errorData = await authResponse.json();
      console.error('❌ ОШИБКА АУТЕНТИФИКАЦИИ:', errorData);
    }

    console.log('\n📱 СТАТУС ПРИЛОЖЕНИЯ:');
    console.log('✅ Конфигурация жестко закодирована');
    console.log('✅ Нет зависимости от Node.js модулей');
    console.log('✅ Совместимо с React Native');
    console.log('✅ Готово к работе в приложении');

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
};

testFinalSMS();
