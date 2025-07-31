// Тестирование MediaService и диагностика проблем с Supabase Storage
import { supabase } from '../services/supabaseClient';

export const testMediaService = async () => {
  console.log('🧪 [Test] Начинаем тестирование MediaService...');

  // 1. Проверка подключения к Supabase
  console.log('\n📡 [Test] Шаг 1: Проверка подключения к Supabase');
  if (!supabase) {
    console.error('❌ [Test] Supabase клиент не инициализирован');
    return false;
  }
  console.log('✅ [Test] Supabase клиент инициализирован');
  console.log(`🌐 [Test] URL: ${supabase.supabaseUrl}`);

  // 2. Проверка аутентификации
  console.log('\n👤 [Test] Шаг 2: Проверка аутентификации');
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.warn('⚠️ [Test] Ошибка аутентификации (ожидаемо для анонимного доступа):', authError.message);
    } else {
      console.log(`✅ [Test] Пользователь: ${user ? `ID: ${user.id}` : 'Анонимный'}`);
    }
  } catch (e) {
    console.warn('⚠️ [Test] Проблема с проверкой аутентификации:', e);
  }

  // 3. Проверка Storage buckets
  console.log('\n📦 [Test] Шаг 3: Проверка Storage buckets');
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ [Test] Ошибка получения списка buckets:', bucketsError);
      console.error('💡 [Test] Возможные причины:');
      console.error('  - Нет политики для просмотра buckets');
      console.error('  - Проблемы с настройками Storage');
      console.error('💡 [Test] Решение: выполните STORAGE_POLICIES_ANONYMOUS.sql');
      return false;
    }

    console.log(`✅ [Test] Найдено buckets: ${buckets.length}`);
    buckets.forEach((bucket: any, index: number) => {
      console.log(`  ${index + 1}. "${bucket.name}" (public: ${bucket.public})`);
    });

    const orderMediaBucket = buckets.find((b: any) => b.name === 'order-media');
    if (!orderMediaBucket) {
      console.error('❌ [Test] Bucket "order-media" не найден!');
      console.error('💡 [Test] Создайте bucket: Dashboard → Storage → New Bucket');
      return false;
    }

    if (!orderMediaBucket.public) {
      console.warn('⚠️ [Test] Bucket "order-media" не публичный!');
      console.warn('💡 [Test] Включите: Dashboard → Storage → order-media → Settings → Public');
    }

    console.log('✅ [Test] Bucket "order-media" найден и настроен правильно');

  } catch (e) {
    console.error('❌ [Test] Критическая ошибка при проверке buckets:', e);
    return false;
  }

  // 4. Тест доступа к bucket
  console.log('\n🔍 [Test] Шаг 4: Тест доступа к bucket');
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('order-media')
      .list('', { limit: 1 });

    if (listError) {
      console.error('❌ [Test] Ошибка доступа к bucket:', listError);
      console.error('💡 [Test] Возможные причины:');
      console.error('  - Нет политики для SELECT на storage.objects');
      console.error('  - Bucket не существует');
      console.error('💡 [Test] Решение: выполните STORAGE_POLICIES_ANONYMOUS.sql');
      return false;
    }

    console.log(`✅ [Test] Доступ к bucket успешен (файлов в корне: ${files.length})`);

  } catch (e) {
    console.error('❌ [Test] Критическая ошибка при доступе к bucket:', e);
    return false;
  }

  // 5. Тест создания тестового файла
  console.log('\n📤 [Test] Шаг 5: Тест загрузки файла');
  try {
    const testContent = 'Test file content for MediaService';
    const testFileName = `test/test_${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order-media')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ [Test] Ошибка загрузки тестового файла:', uploadError);
      console.error('💡 [Test] Возможные причины:');
      console.error('  - Нет политики для INSERT на storage.objects');
      console.error('  - Проблемы с аутентификацией');
      console.error('💡 [Test] Решение: выполните STORAGE_POLICIES_ANONYMOUS.sql');
      return false;
    }

    console.log('✅ [Test] Тестовый файл успешно загружен:', uploadData.path);

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('order-media')
      .getPublicUrl(testFileName);

    console.log('✅ [Test] Публичный URL:', urlData.publicUrl);

    // Удаляем тестовый файл
    await supabase.storage
      .from('order-media')
      .remove([testFileName]);
    console.log('✅ [Test] Тестовый файл удален');

  } catch (e) {
    console.error('❌ [Test] Критическая ошибка при тестировании загрузки:', e);
    return false;
  }

  console.log('\n🎉 [Test] ВСЕ ТЕСТЫ ПРОЙДЕНЫ! MediaService готов к работе');
  return true;
};

// Экспорт для использования в DevScreen
export const runMediaServiceTest = async () => {
  try {
    const success = await testMediaService();
    return {
      success,
      message: success
        ? 'Все проверки пройдены! Storage настроен правильно'
        : 'Есть проблемы с настройкой Storage. Проверьте логи.'
    };
  } catch (error) {
    console.error('❌ [Test] Неожиданная ошибка:', error);
    return {
      success: false,
      message: `Ошибка тестирования: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    };
  }
}; 