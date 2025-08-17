import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';

export interface MediaUploadResult {
  success: boolean;
  urls?: string[];
  error?: string;
}

export interface MediaOptimizationSettings {
  // Настройки для изображений
  maxImageWidth: number;
  maxImageHeight: number;
  imageQuality: number; // 0.0 - 1.0

  // Настройки для видео
  maxVideoSize: number; // в байтах

  // Общие настройки
  enableOptimization: boolean;
}

export class MediaService {
  private static instance: MediaService;
  private readonly BUCKET_NAME = 'order-media';
  private readonly ENABLE_STORAGE = true; // Поставьте false для отключения Storage

  // Настройки оптимизации медиа
  private readonly optimizationSettings: MediaOptimizationSettings = {
    maxImageWidth: 1920,      // Максимальная ширина изображения
    maxImageHeight: 1080,     // Максимальная высота изображения
    imageQuality: 0.8,        // Качество сжатия изображений (80%)
    maxVideoSize: 20 * 1024 * 1024, // Максимальный размер видео 20 МБ
    enableOptimization: true  // Включить оптимизацию
  };

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Получает текущие настройки оптимизации
   */
  getOptimizationSettings(): MediaOptimizationSettings {
    return { ...this.optimizationSettings };
  }

  /**
   * Обновляет настройки оптимизации
   */
  updateOptimizationSettings(newSettings: Partial<MediaOptimizationSettings>): void {
    Object.assign(this.optimizationSettings, newSettings);
    console.log('[MediaService] ⚙️ Настройки оптимизации обновлены:', this.optimizationSettings);
  }

  /**
   * Проверяет существование bucket для медиа файлов
   */
  private async ensureBucketExists(): Promise<boolean> {
    try {
      console.log(`[MediaService] 🔍 Проверяем bucket '${this.BUCKET_NAME}'...`);

      // Сначала попробуем прямое обращение к bucket (более надежно)
      console.log('[MediaService] 🎯 Прямая проверка bucket...');
      try {
        const { data: testData, error: testError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .list('', { limit: 1 });

        if (testError) {
          console.error('[MediaService] ❌ Ошибка доступа к bucket:', testError);

          // Диагностика ошибок
          if (testError.message?.includes('JWT') || testError.message?.includes('session missing')) {
            console.error('[MediaService] 🔑 Проблема с аутентификацией - нужны анонимные политики');
            console.error('[MediaService] 💡 Выполните SQL: STORAGE_POLICIES_ANONYMOUS.sql');
          } else if (testError.message?.includes('not found')) {
            console.error('[MediaService] 📦 Bucket не найден - создайте в Dashboard');
            console.error('[MediaService] 💡 Storage → New Bucket → name: order-media → Public: ✅');
          } else if (testError.message?.includes('policy')) {
            console.error('[MediaService] 🔒 Проблема с RLS политиками');
            console.error('[MediaService] 💡 Выполните: CREATE POLICY "Public buckets are viewable by everyone" ON storage.buckets FOR SELECT USING (true);');
          }

          return false;
        } else {
          console.log('[MediaService] ✅ Bucket доступен и работает!');
          return true;
        }
      } catch (directError) {
        console.error('[MediaService] ❌ Критическая ошибка прямого доступа:', directError);

        // Попробуем listBuckets как fallback, но с обработкой ошибок
        console.log('[MediaService] 🔄 Fallback: проверяем через listBuckets...');
        try {
          const { data: buckets, error: listError } = await supabase.storage.listBuckets();

          if (listError) {
            console.error('[MediaService] ❌ listBuckets также не работает:', listError);
            return false;
          }

          if (!buckets || !Array.isArray(buckets)) {
            console.error('[MediaService] ❌ Некорректный ответ от listBuckets');
            return false;
          }

          console.log(`[MediaService] 📋 Найдено buckets: ${buckets.length}`);

          const bucketExists = buckets.some((bucket: { name: string }) => bucket?.name === this.BUCKET_NAME);

          if (bucketExists) {
            console.log(`[MediaService] ✅ Bucket '${this.BUCKET_NAME}' найден в списке!`);
            return true;
          } else {
            console.error(`[MediaService] ❌ Bucket '${this.BUCKET_NAME}' НЕ НАЙДЕН в списке!`);
            console.error('[MediaService] 💡 Создайте bucket в Supabase Dashboard');
            return false;
          }
        } catch (listBucketsError) {
          console.error('[MediaService] ❌ Критическая ошибка listBuckets:', listBucketsError);
          return false;
        }
      }
    } catch (error) {
      console.error('[MediaService] ❌ Неожиданная ошибка при проверке bucket:', error);
      console.error('[MediaService] 💡 Проверьте настройки Supabase в supabaseClient.ts');
      return false;
    }
  }

  /**
   * Проверяет и восстанавливает аутентификацию Supabase
   */
  private async ensureAuthentication(): Promise<void> {
    try {
      console.log('[MediaService] 🔍 Проверяем аутентификацию...');

      // Проверяем текущего пользователя с обработкой ошибок
      let user = null;
      let authError = null;

      try {
        const result = await supabase.auth.getUser();
        user = result.data?.user;
        authError = result.error;
      } catch (getUserError) {
        console.warn('[MediaService] ⚠️ Ошибка getUser():', getUserError);
        authError = getUserError;
      }

      if (authError || !user) {
        console.warn('[MediaService] ⚠️ Аутентификация не настроена:', authError?.message || 'Auth session missing!');

        // Пытаемся восстановить сессию из AsyncStorage
        console.log('[MediaService] 🔄 Пытаемся восстановить Supabase сессию из AsyncStorage...');

        try {
          const storedSession = await AsyncStorage.getItem('@osonish_supabase_session');
          console.log('[MediaService] 📱 Проверяем сохраненную сессию:', storedSession ? 'найдена' : 'не найдена');

          if (storedSession) {
            try {
              console.log('[MediaService] 🔄 Восстанавливаем Supabase сессию...');
              const session = JSON.parse(storedSession);

              // Проверяем валидность сессии
              if (!session || !session.access_token) {
                console.warn('[MediaService] ❌ Сессия повреждена, удаляем...');
                await AsyncStorage.removeItem('@osonish_supabase_session');
                console.log('[MediaService] 💡 Используем анонимную загрузку');
                return;
              }

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
              try {
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
              } catch (verifyError) {
                console.warn('[MediaService] ❌ Ошибка проверки восстановленной сессии:', verifyError);
                console.log('[MediaService] 💡 Используем анонимную загрузку');
              }
            } catch (parseError) {
              console.error('[MediaService] ❌ Ошибка парсинга сессии:', parseError);
              // Удаляем поврежденную сессию
              try {
                await AsyncStorage.removeItem('@osonish_supabase_session');
              } catch (removeError) {
                console.error('[MediaService] ❌ Ошибка удаления поврежденной сессии:', removeError);
              }
              console.log('[MediaService] 💡 Используем анонимную загрузку');
            }
          } else {
            console.log('[MediaService] 💡 Сохраненная сессия не найдена, используем анонимную загрузку');
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
      console.warn('[MediaService] ⚠️ Критическая ошибка проверки аутентификации:', error);
      console.log('[MediaService] 💡 Используем анонимную загрузку (требуются анонимные политики Storage)');
    }
  }

  /**
   * Рассчитывает новые размеры изображения с сохранением пропорций
   */
  private calculateOptimalSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number; needsResize: boolean } {

    // Если изображение уже меньше максимальных размеров, не изменяем
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return {
        width: originalWidth,
        height: originalHeight,
        needsResize: false
      };
    }

    // Рассчитываем коэффициенты масштабирования
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;

    // Выбираем меньший коэффициент, чтобы изображение поместилось в рамки
    const scaleFactor = Math.min(widthRatio, heightRatio);

    const newWidth = Math.round(originalWidth * scaleFactor);
    const newHeight = Math.round(originalHeight * scaleFactor);

    console.log(`[MediaService] 🔢 Коэффициент масштабирования: ${scaleFactor.toFixed(3)}`);
    console.log(`[MediaService] 📐 Пропорции: ${(originalWidth / originalHeight).toFixed(3)} → ${(newWidth / newHeight).toFixed(3)}`);

    return {
      width: newWidth,
      height: newHeight,
      needsResize: true
    };
  }

  /**
   * Оптимизирует изображение: изменяет размер и сжимает
   */
  private async optimizeImage(uri: string, originalName: string): Promise<{ uri: string; size: number; name: string }> {
    try {
      if (!this.optimizationSettings.enableOptimization) {
        // Если оптимизация отключена, возвращаем оригинал
        const fileInfo = await FileSystem.getInfoAsync(uri);
        return {
          uri,
          size: fileInfo.size || 0,
          name: originalName
        };
      }

      console.log(`[MediaService] 🔧 Оптимизируем изображение: ${originalName}`);

      // Получаем информацию о файле
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const originalSize = fileInfo.size || 0;

      console.log(`[MediaService] 📏 Оригинальный размер: ${(originalSize / 1024).toFixed(1)} KB`);

      // Получаем размеры изображения для расчета пропорций
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], { base64: false });

      console.log(`[MediaService] 📐 Оригинальные размеры: ${imageInfo.width}x${imageInfo.height}`);

      // Рассчитываем оптимальные размеры с сохранением пропорций
      const optimalSize = this.calculateOptimalSize(
        imageInfo.width,
        imageInfo.height,
        this.optimizationSettings.maxImageWidth,
        this.optimizationSettings.maxImageHeight
      );

      console.log(`[MediaService] 📐 Новые размеры: ${optimalSize.width}x${optimalSize.height}`);

      // Создаем массив операций для ImageManipulator
      const manipulateActions = [];

      // Добавляем resize только если размеры нужно изменить
      if (optimalSize.needsResize) {
        manipulateActions.push({
          resize: {
            width: optimalSize.width,
            height: optimalSize.height,
          }
        });
      }

      // Оптимизируем изображение
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        manipulateActions,
        {
          compress: this.optimizationSettings.imageQuality,
          format: ImageManipulator.SaveFormat.JPEG, // Конвертируем в JPEG для лучшего сжатия
          base64: false
        }
      );

      // Получаем размер оптимизированного файла
      const optimizedFileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      const optimizedSize = optimizedFileInfo.size || 0;

      const compressionRatio = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize * 100) : 0;

      console.log(`[MediaService] ✅ Оптимизировано: ${(optimizedSize / 1024).toFixed(1)} KB`);
      console.log(`[MediaService] 📉 Сжатие: ${compressionRatio.toFixed(1)}%`);
      console.log(`[MediaService] 📐 Финальные размеры: ${manipulatedImage.width}x${manipulatedImage.height}`);

      // Генерируем новое имя файла с расширением .jpg
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      const optimizedName = `${nameWithoutExt}_optimized.jpg`;

      return {
        uri: manipulatedImage.uri,
        size: optimizedSize,
        name: optimizedName
      };

    } catch (error) {
      console.error(`[MediaService] ❌ Ошибка оптимизации изображения ${originalName}:`, error);

      // В случае ошибки возвращаем оригинал
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return {
        uri,
        size: fileInfo.size || 0,
        name: originalName
      };
    }
  }

  /**
   * Проверяет размер видео и при необходимости показывает предупреждение
   */
  private async checkVideoSize(uri: string, originalName: string): Promise<{ uri: string; size: number; name: string; warning?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const size = fileInfo.size || 0;

      console.log(`[MediaService] 🎥 Видео ${originalName}: ${(size / 1024 / 1024).toFixed(1)} MB`);

      let warning: string | undefined;

      if (size > this.optimizationSettings.maxVideoSize) {
        warning = `Видео файл большой (${(size / 1024 / 1024).toFixed(1)} MB). Рекомендуется сжать до ${(this.optimizationSettings.maxVideoSize / 1024 / 1024).toFixed(0)} MB.`;
        console.warn(`[MediaService] ⚠️ ${warning}`);
      }

      return {
        uri,
        size,
        name: originalName,
        warning
      };

    } catch (error) {
      console.error(`[MediaService] ❌ Ошибка проверки видео ${originalName}:`, error);
      return {
        uri,
        size: 0,
        name: originalName
      };
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

      // Проверяем и восстанавливаем аутентификацию с обработкой ошибок
      try {
        await this.ensureAuthentication();
      } catch (authError) {
        console.warn('[MediaService] ⚠️ Ошибка проверки аутентификации:', authError);
        console.log('[MediaService] 💡 Продолжаем с анонимным доступом');
      }

      // Проверяем и создаем bucket при необходимости с обработкой ошибок
      let bucketReady = false;
      try {
        bucketReady = await this.ensureBucketExists();
      } catch (bucketError) {
        console.error('[MediaService] ❌ Критическая ошибка проверки bucket:', bucketError);
        return {
          success: false,
          error: 'Критическая ошибка доступа к хранилищу файлов.'
        };
      }

      if (!bucketReady) {
        return {
          success: false,
          error: 'Хранилище файлов не настроено. Обратитесь к администратору.'
        };
      }

      // Сначала оптимизируем все файлы
      console.log('[MediaService] 🔧 Оптимизируем медиа файлы...');
      const optimizedFiles = await Promise.all(
        files.map(async (file, index) => {
          let processedFile = file;

          if (file.type === 'image') {
            // Оптимизируем изображения
            const optimized = await this.optimizeImage(file.uri, file.name);
            processedFile = {
              uri: optimized.uri,
              type: file.type,
              name: optimized.name,
              size: optimized.size
            };
          } else if (file.type === 'video') {
            // Проверяем размер видео
            const checked = await this.checkVideoSize(file.uri, file.name);
            processedFile = {
              uri: checked.uri,
              type: file.type,
              name: checked.name,
              size: checked.size
            };

            if (checked.warning) {
              console.warn(`[MediaService] ⚠️ ${checked.warning}`);
            }
          }

          return processedFile;
        })
      );

      // Подсчитываем общий размер после оптимизации
      const totalOptimizedSize = optimizedFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`[MediaService] 📊 Общий размер после оптимизации: ${(totalOptimizedSize / 1024 / 1024).toFixed(1)} MB`);

      const uploadPromises = optimizedFiles.map(async (file, index) => {
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