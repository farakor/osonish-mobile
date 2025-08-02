import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MediaUploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

export class MediaService {
  private static instance: MediaService;
  private readonly BUCKET_NAME = 'order-media';
  private readonly ENABLE_STORAGE = true; // Поставьте false для отключения Storage

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Проверяет существование bucket для медиа файлов
   */
  private async ensureBucketExists(): Promise<boolean> {
    try {
      console.log(`[MediaService] 🔍 Проверяем bucket '${this.BUCKET_NAME}'...`);

      // Проверяем подключение к Supabase Storage
      console.log('[MediaService] 📡 Отправляем запрос listBuckets()...');
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('[MediaService] ❌ Ошибка подключения к Storage:', listError);
        console.error('[MediaService] Детали ошибки:', JSON.stringify(listError, null, 2));
        console.error(`[MediaService] Код ошибки: ${listError.status}`);
        console.error(`[MediaService] Сообщение: ${listError.message}`);

        // Попробуем альтернативный способ - проверить конкретный bucket
        console.log('[MediaService] 🔄 Пробуем альтернативный способ проверки...');
        try {
          const { data: testData, error: testError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .list('', { limit: 1 });

          if (testError) {
            console.error('[MediaService] ❌ Альтернативная проверка не удалась:', testError);

            // Дополнительная диагностика типов ошибок
            if (testError.message?.includes('JWT')) {
              console.error('[MediaService] 🔑 Проблема с аутентификацией - нужны анонимные политики');
              console.error('[MediaService] 💡 Выполните SQL: STORAGE_POLICIES_ANONYMOUS.sql');
            } else if (testError.message?.includes('not found')) {
              console.error('[MediaService] 📦 Bucket не найден - создайте в Dashboard');
              console.error('[MediaService] 💡 Storage → New Bucket → name: order-media → Public: ✅');
            } else if (testError.message?.includes('policy')) {
              console.error('[MediaService] 🔒 Проблема с RLS политиками');
              console.error('[MediaService] 💡 Выполните: CREATE POLICY "Public buckets are viewable by everyone" ON storage.buckets FOR SELECT USING (true);');
            }
          } else {
            console.log('[MediaService] ✅ Альтернативная проверка: bucket существует!');
            return true; // Bucket существует, даже если listBuckets() не работает
          }
        } catch (altError) {
          console.error('[MediaService] ❌ Альтернативная проверка - критическая ошибка:', altError);
        }

        return false;
      }

      console.log(`[MediaService] 📋 Найдено buckets: ${buckets.length}`);
      console.log('[MediaService] Список всех buckets:');
      buckets.forEach((bucket: { name: string, id: string, public: boolean }, index: number) => {
        console.log(`  ${index + 1}. "${bucket.name}" (id: ${bucket.id}, public: ${bucket.public})`);
      });

      const bucketExists = buckets.some((bucket: { name: string }) => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        console.error(`[MediaService] ❌ Bucket '${this.BUCKET_NAME}' НЕ НАЙДЕН в списке!`);

        // Попробуем альтернативный способ - прямое обращение к bucket
        console.log('[MediaService] 🔄 Пробуем прямое обращение к bucket...');
        try {
          const { data: listData, error: directError } = await supabase.storage
            .from(this.BUCKET_NAME)
            .list('', { limit: 1 });

          if (directError) {
            console.error('[MediaService] ❌ Прямое обращение не удалось:', directError);
            if (directError.message?.includes('not found')) {
              console.error('[MediaService] 💀 Bucket действительно не существует');
            } else if (directError.message?.includes('permission') || directError.message?.includes('policy')) {
              console.error('[MediaService] 🔒 Проблема с правами доступа (RLS политики)');
              console.error('[MediaService] 💡 Решение: настройте политики в Storage → Policies');
            }
          } else {
            console.log('[MediaService] ✅ Прямое обращение успешно! Bucket существует');
            console.log('[MediaService] 🔍 Возможно проблема с политикой listBuckets');
            return true; // Bucket существует, используем его
          }
        } catch (directAltError) {
          console.error('[MediaService] ❌ Прямое обращение - критическая ошибка:', directAltError);
        }

        console.error('[MediaService] 💡 Возможные решения:');
        console.error('  1. Создайте bucket: https://supabase.com → Storage → Create bucket');
        console.error(`  2. Name: ${this.BUCKET_NAME} (точно так!)`);
        console.error('  3. Public bucket: ✅ Включите');
        console.error('  4. Настройте политики Storage → Policies');
        console.error('  5. Выполните SQL скрипт: STORAGE_POLICIES_ANONYMOUS.sql');
        return false;
      }

      console.log(`[MediaService] ✅ Bucket '${this.BUCKET_NAME}' найден!`);
      return true;
    } catch (error) {
      console.error('[MediaService] ❌ Критическая ошибка при проверке bucket:', error);
      console.error('[MediaService] 💡 Проверьте настройки Supabase в supabaseClient.ts');
      return false;
    }
  }

  /**
   * Проверяет и восстанавливает аутентификацию Supabase
   */
  private async ensureAuthentication(): Promise<void> {
    console.log('[MediaService] 🔍 Проверяем аутентификацию...');

    try {
      // Проверяем текущего пользователя
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn('[MediaService] ⚠️ Аутентификация не настроена:', authError?.message || 'Auth session missing!');

        // Пытаемся восстановить сессию из AsyncStorage
        console.log('[MediaService] 🔄 Пытаемся восстановить Supabase сессию из AsyncStorage...');

        try {
          const storedSession = await AsyncStorage.getItem('@osonish_supabase_session');
          console.log('[MediaService] 📱 Проверяем сохраненную сессию:', storedSession ? 'найдена' : 'не найдена');

          if (storedSession) {
            console.log('[MediaService] 🔄 Восстанавливаем Supabase сессию...');
            const session = JSON.parse(storedSession);
            console.log('[MediaService] 📋 Сессия содержит:', {
              hasAccessToken: !!session.access_token,
              hasRefreshToken: !!session.refresh_token,
              expiresAt: session.expires_at
            });

            const { data, error: setSessionError } = await supabase.auth.setSession(session);

            if (setSessionError) {
              console.error('[MediaService] ❌ Ошибка установки сессии:', setSessionError.message);
              // Удаляем поврежденную сессию
              await AsyncStorage.removeItem('@osonish_supabase_session');
              console.log('[MediaService] 💡 Используем анонимную загрузку (требуются анонимные политики Storage)');
              return;
            }

            // Проверяем снова после установки сессии
            console.log('[MediaService] ✅ Сессия установлена, проверяем пользователя...');
            const { data: { user: restoredUser }, error: restoreError } = await supabase.auth.getUser();

            if (restoreError || !restoredUser) {
              console.warn('[MediaService] ❌ Пользователь не найден после восстановления сессии');
              console.warn('[MediaService] Ошибка:', restoreError?.message);
              console.log('[MediaService] 💡 Используем анонимную загрузку (требуются анонимные политики Storage)');
            } else {
              console.log('[MediaService] ✅ Supabase сессия успешно восстановлена!');
              console.log(`[MediaService] 👤 Пользователь: ${restoredUser.id}`);
              console.log(`[MediaService] 📧 Email: ${restoredUser.email || 'не указан'}`);
            }
          } else {
            console.log('[MediaService] 💡 Сохраненная сессия не найдена, используем анонимную загрузку');
            console.log('[MediaService] 🔍 Проверим все ключи AsyncStorage...');

            // Проверим все возможные ключи
            const allKeys = await AsyncStorage.getAllKeys();
            const relevantKeys = allKeys.filter(key => key.includes('osonish') || key.includes('supabase'));
            console.log('[MediaService] 🗂️ Найденные ключи Osonish:', relevantKeys);

            for (const key of relevantKeys) {
              const value = await AsyncStorage.getItem(key);
              console.log(`[MediaService] 🔑 ${key}: ${value ? 'имеет значение' : 'пустое'}`);
            }
          }
        } catch (sessionError) {
          console.warn('[MediaService] ⚠️ Ошибка восстановления сессии:', sessionError);
          console.log('[MediaService] 💡 Используем анонимную загрузку (требуются анонимные политики Storage)');
        }
      } else {
        console.log(`[MediaService] ✅ Пользователь уже аутентифицирован: ${user.id}`);
        console.log(`[MediaService] 📧 Email: ${user.email || 'не указан'}`);
      }
    } catch (error) {
      console.warn('[MediaService] ⚠️ Ошибка проверки аутентификации:', error);
      console.log('[MediaService] 💡 Используем анонимную загрузку (требуются анонимные политики Storage)');
    }
  }

  /**
   * Загружает медиа файлы в Supabase Storage
   */
  async uploadMediaFiles(files: Array<{ uri: string, type: 'image' | 'video', name: string, size: number }>): Promise<MediaUploadResult> {
    try {
      console.log('[MediaService] 🚀 Начинаем загрузку медиа файлов...');
      console.log(`[MediaService] Количество файлов: ${files.length}`);

      // Проверяем, включен ли Storage
      if (!this.ENABLE_STORAGE) {
        console.log('[MediaService] ⚠️ Storage отключен в конфигурации');
        return {
          success: false,
          error: 'Storage отключен в настройках'
        };
      }

      // Проверяем конфигурацию Supabase
      if (!supabase) {
        console.error('[MediaService] ❌ Supabase клиент не инициализирован');
        return {
          success: false,
          error: 'Supabase клиент не настроен'
        };
      }

      console.log('[MediaService] ✅ Supabase клиент инициализирован');
      console.log(`[MediaService] 🌐 Supabase URL: ${supabase.supabaseUrl}`);
      console.log(`[MediaService] 🔑 Auth: ${supabase.supabaseKey ? 'настроен' : 'не настроен'}`);

      // Проверяем и восстанавливаем аутентификацию
      await this.ensureAuthentication();

      // Проверяем и создаем bucket при необходимости
      const bucketReady = await this.ensureBucketExists();
      if (!bucketReady) {
        return {
          success: false,
          error: 'Хранилище файлов не настроено. Обратитесь к администратору.'
        };
      }

      const uploadPromises = files.map(async (file, index) => {
        try {
          // Получаем расширение файла
          const fileExtension = file.name.split('.').pop() || (file.type === 'image' ? 'jpg' : 'mp4');

          // Генерируем уникальное имя файла
          const fileName = `${Date.now()}_${index}.${fileExtension}`;
          const filePath = `orders/${fileName}`;

          console.log(`[MediaService] 📁 Подготавливаем файл ${file.name} для загрузки...`);
          console.log(`[MediaService] 📱 URI: ${file.uri}`);
          console.log(`[MediaService] 📏 Размер: ${(file.size / 1024).toFixed(1)} KB`);
          console.log(`[MediaService] 🎯 Тип: ${file.type}`);

          // Правильный способ читать файл в React Native
          const base64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Конвертируем base64 в ArrayBuffer для Supabase
          const arrayBuffer = decode(base64);

          // Определяем правильный MIME type
          const contentType = file.type === 'image' ? 'image/jpeg' :
            file.type === 'video' ? 'video/mp4' :
              file.name.toLowerCase().includes('.png') ? 'image/png' :
                file.name.toLowerCase().includes('.jpg') || file.name.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
                  'application/octet-stream';

          console.log(`[MediaService] 🏷️ Content-Type: ${contentType}`);
          console.log(`[MediaService] 📤 Загружаем в путь: ${filePath}`);

          // Загружаем файл в Supabase Storage
          const { data, error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, arrayBuffer, {
              contentType: contentType,
              upsert: false
            });

          if (error) {
            console.error(`[MediaService] Ошибка загрузки файла ${file.name}:`, error);

            // Диагностика RLS ошибок
            if (error.message?.includes('row-level security policy')) {
              console.error('');
              console.error('🔒 RLS POLICY ERROR - КАК ИСПРАВИТЬ:');
              console.error('1. Откройте Supabase Dashboard → Storage');
              console.error('2. Убедитесь что bucket "order-media" PUBLIC');
              console.error('3. Добавьте политику: SELECT с условием "true"');
              console.error('4. Добавьте политику: INSERT с условием "true"');
              console.error('5. Или следуйте инструкции в QUICK_STORAGE_FIX.md');
              console.error('');
            } else if (error.message?.includes('JWT') || error.message?.includes('session missing')) {
              console.error('');
              console.error('🔑 AUTHENTICATION ERROR - РЕШЕНИЕ:');
              console.error('1. Выполните SQL скрипт: STORAGE_POLICIES_ANONYMOUS.sql');
              console.error('2. Это разрешит анонимную загрузку в order-media bucket');
              console.error('3. Перезапустите приложение после выполнения SQL');
              console.error('');
            } else if (error.message?.includes('not found') || error.message?.includes('bucket')) {
              console.error('');
              console.error('📦 BUCKET ERROR - РЕШЕНИЕ:');
              console.error('1. Создайте bucket "order-media" в Supabase Dashboard');
              console.error('2. Storage → New Bucket → Name: order-media');
              console.error('3. Public bucket: ✅ ОБЯЗАТЕЛЬНО включите');
              console.error('4. Выполните политики из STORAGE_POLICIES_ANONYMOUS.sql');
              console.error('');
            } else if (error.message?.includes('size') || error.message?.includes('limit')) {
              console.error('');
              console.error('📏 SIZE ERROR - файл слишком большой');
              console.error(`Размер файла: ${(file.size / 1024 / 1024).toFixed(1)} МБ`);
              console.error('Максимальный размер: зависит от настроек Supabase');
              console.error('');
            }

            throw error;
          }

          // Получаем публичный URL
          const { data: urlData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(filePath);

          console.log(`[MediaService] 📄 Файл ${file.name}:`);
          console.log(`[MediaService] 📁 Путь: ${filePath}`);
          console.log(`[MediaService] 🔗 URL: ${urlData.publicUrl}`);

          return urlData.publicUrl;
        } catch (error) {
          console.error(`[MediaService] Ошибка обработки файла ${file.name}:`, error);
          throw error;
        }
      });

      // Ждем загрузки всех файлов
      const urls = await Promise.all(uploadPromises);

      console.log(`[MediaService] ✅ Загружено ${urls.length} файлов`);

      return {
        success: true,
        urls
      };

    } catch (error) {
      console.error('[MediaService] Ошибка загрузки файлов:', error);

      // Определяем тип ошибки и даем конкретные советы
      let errorMessage = 'Не удалось загрузить медиа файлы';

      if (error instanceof Error) {
        if (error.message?.includes('row-level security policy')) {
          errorMessage = 'Ошибка доступа к Storage. Настройте публичные политики.';
          console.error('');
          console.error('💡 БЫСТРОЕ РЕШЕНИЕ:');
          console.error('Выполните инструкцию из файла QUICK_STORAGE_FIX.md');
          console.error('');
        } else if (error.message?.includes('JWT') || error.message?.includes('session missing')) {
          errorMessage = 'Ошибка аутентификации. Настройте анонимный доступ к Storage.';
          console.error('');
          console.error('💡 БЫСТРОЕ РЕШЕНИЕ:');
          console.error('1. Выполните SQL скрипт: STORAGE_POLICIES_ANONYMOUS.sql');
          console.error('2. Это разрешит анонимную загрузку файлов');
          console.error('');
        } else if (error.message?.includes('not found') || error.message?.includes('bucket')) {
          errorMessage = 'Bucket "order-media" не настроен. Создайте его в Dashboard.';
          console.error('');
          console.error('💡 БЫСТРОЕ РЕШЕНИЕ:');
          console.error('1. Supabase Dashboard → Storage → New Bucket');
          console.error('2. Name: order-media, Public: ✅');
          console.error('3. Выполните SQL: STORAGE_POLICIES_ANONYMOUS.sql');
          console.error('');
        } else if (error.message?.includes('size') || error.message?.includes('limit')) {
          errorMessage = 'Файлы слишком большие. Попробуйте меньшие файлы.';
        } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
          errorMessage = 'Проблема с сетью. Проверьте подключение к интернету.';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Удаляет медиа файлы из Storage (для будущего использования)
   */
  async deleteMediaFiles(urls: string[]): Promise<boolean> {
    try {
      const filePaths = urls.map(url => {
        // Извлекаем путь файла из публичного URL
        const urlParts = url.split('/');
        return urlParts.slice(-2).join('/'); // orders/filename.ext
      });

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (error) {
        console.error('[MediaService] Ошибка удаления файлов:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[MediaService] Ошибка удаления файлов:', error);
      return false;
    }
  }
}

export const mediaService = MediaService.getInstance(); 