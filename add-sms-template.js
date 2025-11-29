/**
 * Скрипт для добавления SMS шаблона в Eskiz.uz
 * Запуск: node add-sms-template.js
 */

require('dotenv').config();

const addSMSTemplate = async () => {
  console.log('📝 Добавление SMS шаблона в Eskiz.uz...\n');

  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;
  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';

  // Шаблоны SMS для добавления
  const templates = [
    'Ваш код подтверждения для Oson Ish: {code}. Не сообщайте этот код никому.',
    'Код верификации Oson Ish: {code}',
    'Oson Ish verification code: {code}',
    'Ваш код: {code}. Oson Ish'
  ];

  try {
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

    console.log('✅ Аутентификация успешна\n');

    // Добавляем каждый шаблон
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      console.log(`📝 Добавление шаблона ${i + 1}/${templates.length}:`);
      console.log(`"${template}"`);

      try {
        const templateResponse = await fetch(`${baseUrl}/message/sms/send-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.data.token}`,
          },
          body: JSON.stringify({
            messages: [{
              user_sms_id: `template_${Date.now()}_${i}`,
              to: '998901234567', // Тестовый номер
              text: template.replace('{code}', '123456')
            }],
            from: process.env.SMS_SENDER_NAME || 'OsonIsh',
            dispatch_id: `template_batch_${Date.now()}`
          }),
        });

        const templateData = await templateResponse.json();
        
        if (templateResponse.ok) {
          console.log('✅ Шаблон отправлен на модерацию');
        } else {
          console.log('⚠️ Ответ:', templateData.message || 'Неизвестная ошибка');
        }
      } catch (error) {
        console.log('❌ Ошибка добавления шаблона:', error.message);
      }

      console.log(''); // Пустая строка для разделения
    }

    console.log('📋 Рекомендации:');
    console.log('1. Зайдите в личный кабинет my.eskiz.uz');
    console.log('2. Перейдите в "СМС" → "Мои тексты"');
    console.log('3. Добавьте шаблон вручную:');
    console.log('   "Ваш код подтверждения для Oson Ish: {code}. Не сообщайте этот код никому."');
    console.log('4. Дождитесь одобрения модератором');
    console.log('5. После одобрения повторите тест отправки SMS');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
};

addSMSTemplate();
