/**
 * Тест текущих учетных данных Eskiz
 */

const testCurrentCredentials = async () => {
  console.log('🔐 ТЕСТ ТЕКУЩИХ УЧЕТНЫХ ДАННЫХ ESKIZ');
  console.log('═══════════════════════════════════════════════════════════\n');

  const credentials = {
    email: 'info@oson-ish.uz',
    password: 'O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g'
  };

  console.log('📧 Email:', credentials.email);
  console.log('🔐 Password:', credentials.password);
  console.log('🌐 Base URL: https://notify.eskiz.uz/api');

  try {
    console.log('\n🔄 Попытка аутентификации...');
    
    const response = await fetch('https://notify.eskiz.uz/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📊 HTTP Status:', response.status);
    console.log('📊 Status Text:', response.statusText);

    const data = await response.json();
    console.log('📋 Полный ответ:', JSON.stringify(data, null, 2));

    if (response.ok && data.data && data.data.token) {
      console.log('\n✅ АУТЕНТИФИКАЦИЯ УСПЕШНА!');
      console.log('🔑 Токен получен:', data.data.token.substring(0, 20) + '...');
      
      // Проверим баланс
      console.log('\n💰 Проверка баланса...');
      const balanceResponse = await fetch('https://notify.eskiz.uz/api/user/get-limit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.data.token}`,
        },
      });

      const balanceData = await balanceResponse.json();
      console.log('💰 Баланс:', JSON.stringify(balanceData, null, 2));

    } else {
      console.log('\n❌ ОШИБКА АУТЕНТИФИКАЦИИ');
      console.log('🔍 Возможные причины:');
      console.log('  • Неверный email или пароль');
      console.log('  • Аккаунт заблокирован');
      console.log('  • Проблемы с API Eskiz');
      
      if (data.message) {
        console.log('📝 Сообщение от API:', data.message);
      }
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
};

testCurrentCredentials();
