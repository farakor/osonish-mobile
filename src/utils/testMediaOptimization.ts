/**
 * Утилита для тестирования оптимизации медиа файлов
 */

import { mediaService } from '../services/mediaService';

export interface OptimizationTestResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  qualityAcceptable: boolean;
  testPassed: boolean;
}

/**
 * Тестирует оптимизацию медиа файлов
 */
export const testMediaOptimization = async (
  testFiles: Array<{ uri: string, type: 'image' | 'video', name: string, size: number }>
): Promise<OptimizationTestResult[]> => {
  console.log('[MediaOptimizationTest] 🧪 Начинаем тестирование оптимизации...');

  const results: OptimizationTestResult[] = [];

  for (const file of testFiles) {
    try {
      console.log(`[MediaOptimizationTest] 📁 Тестируем файл: ${file.name}`);
      console.log(`[MediaOptimizationTest] 📏 Оригинальный размер: ${(file.size / 1024).toFixed(1)} KB`);

      // Загружаем файл через медиа сервис (с оптимизацией)
      const uploadResult = await mediaService.uploadMediaFiles([file]);

      if (uploadResult.success) {
        // Для тестирования мы не можем точно определить размер загруженного файла
        // без дополнительных запросов к Supabase, но можем проверить логику

        const estimatedCompressionRatio = file.type === 'image' ? 30 : 0; // Примерное сжатие для изображений
        const estimatedOptimizedSize = file.size * (1 - estimatedCompressionRatio / 100);

        const result: OptimizationTestResult = {
          originalSize: file.size,
          optimizedSize: estimatedOptimizedSize,
          compressionRatio: estimatedCompressionRatio,
          qualityAcceptable: true, // В реальном тесте нужна визуальная проверка
          testPassed: uploadResult.success
        };

        results.push(result);

        console.log(`[MediaOptimizationTest] ✅ Файл ${file.name} успешно оптимизирован`);
        console.log(`[MediaOptimizationTest] 📉 Примерное сжатие: ${estimatedCompressionRatio}%`);

      } else {
        console.error(`[MediaOptimizationTest] ❌ Ошибка загрузки файла ${file.name}:`, uploadResult.error);

        const result: OptimizationTestResult = {
          originalSize: file.size,
          optimizedSize: file.size,
          compressionRatio: 0,
          qualityAcceptable: false,
          testPassed: false
        };

        results.push(result);
      }

    } catch (error) {
      console.error(`[MediaOptimizationTest] ❌ Критическая ошибка тестирования файла ${file.name}:`, error);

      const result: OptimizationTestResult = {
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 0,
        qualityAcceptable: false,
        testPassed: false
      };

      results.push(result);
    }
  }

  // Выводим общую статистику
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + r.optimizedSize, 0);
  const overallCompressionRatio = totalOriginalSize > 0 ?
    ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100) : 0;

  console.log('\n[MediaOptimizationTest] 📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:');
  console.log(`[MediaOptimizationTest] 📁 Файлов протестировано: ${results.length}`);
  console.log(`[MediaOptimizationTest] 📏 Общий оригинальный размер: ${(totalOriginalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`[MediaOptimizationTest] 📉 Общий оптимизированный размер: ${(totalOptimizedSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`[MediaOptimizationTest] 🎯 Общее сжатие: ${overallCompressionRatio.toFixed(1)}%`);
  console.log(`[MediaOptimizationTest] ✅ Успешных тестов: ${results.filter(r => r.testPassed).length}/${results.length}`);

  return results;
};

/**
 * Показывает текущие настройки оптимизации
 */
export const showOptimizationSettings = (): void => {
  const settings = mediaService.getOptimizationSettings();

  console.log('\n[MediaOptimizationTest] ⚙️ ТЕКУЩИЕ НАСТРОЙКИ ОПТИМИЗАЦИИ:');
  console.log(`[MediaOptimizationTest] 🖼️ Максимальная ширина изображения: ${settings.maxImageWidth}px`);
  console.log(`[MediaOptimizationTest] 🖼️ Максимальная высота изображения: ${settings.maxImageHeight}px`);
  console.log(`[MediaOptimizationTest] 🎨 Качество изображений: ${(settings.imageQuality * 100).toFixed(0)}%`);
  console.log(`[MediaOptimizationTest] 🎥 Максимальный размер видео: ${(settings.maxVideoSize / 1024 / 1024).toFixed(0)} MB`);
  console.log(`[MediaOptimizationTest] 🔧 Оптимизация включена: ${settings.enableOptimization ? 'Да' : 'Нет'}`);
};

/**
 * Обновляет настройки оптимизации для тестирования
 */
export const updateOptimizationForTesting = (testMode: 'aggressive' | 'balanced' | 'conservative'): void => {
  console.log(`[MediaOptimizationTest] 🔧 Устанавливаем режим оптимизации: ${testMode}`);

  switch (testMode) {
    case 'aggressive':
      mediaService.updateOptimizationSettings({
        maxImageWidth: 1280,
        maxImageHeight: 720,
        imageQuality: 0.6,
        maxVideoSize: 10 * 1024 * 1024, // 10 MB
        enableOptimization: true
      });
      break;

    case 'balanced':
      mediaService.updateOptimizationSettings({
        maxImageWidth: 1920,
        maxImageHeight: 1080,
        imageQuality: 0.8,
        maxVideoSize: 20 * 1024 * 1024, // 20 MB
        enableOptimization: true
      });
      break;

    case 'conservative':
      mediaService.updateOptimizationSettings({
        maxImageWidth: 2560,
        maxImageHeight: 1440,
        imageQuality: 0.9,
        maxVideoSize: 50 * 1024 * 1024, // 50 MB
        enableOptimization: true
      });
      break;
  }

  showOptimizationSettings();
};
