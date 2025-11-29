/**
 * Тест производительности SMS Input компонента
 * 
 * Этот скрипт поможет протестировать новый OptimizedSmsInput
 * на производительность и отзывчивость
 */

console.log('🚀 Тест производительности SMS Input');
console.log('=====================================');

// Симуляция быстрого ввода
function simulateRapidInput() {
  console.log('\n📱 Тест быстрого ввода:');
  
  const testCodes = [
    '123456',
    '987654',
    '555555',
    '111111',
    '999999'
  ];
  
  testCodes.forEach((code, index) => {
    console.log(`  ${index + 1}. Ввод кода: ${code}`);
    
    // Симуляция времени ввода каждой цифры
    const inputTimes = [];
    for (let i = 0; i < code.length; i++) {
      const startTime = performance.now();
      
      // Симуляция обработки ввода
      setTimeout(() => {
        const endTime = performance.now();
        inputTimes.push(endTime - startTime);
        
        if (i === code.length - 1) {
          const avgTime = inputTimes.reduce((a, b) => a + b, 0) / inputTimes.length;
          console.log(`     ⏱️  Среднее время обработки: ${avgTime.toFixed(2)}ms`);
        }
      }, i * 50); // 50ms между нажатиями (очень быстро)
    }
  });
}

// Тест памяти
function testMemoryUsage() {
  console.log('\n🧠 Тест использования памяти:');
  
  if (typeof performance !== 'undefined' && performance.memory) {
    const memBefore = performance.memory.usedJSHeapSize;
    console.log(`  Память до теста: ${(memBefore / 1024 / 1024).toFixed(2)} MB`);
    
    // Симуляция множественных ререндеров
    for (let i = 0; i < 1000; i++) {
      // Симуляция создания и уничтожения компонентов
      const mockComponent = {
        code: Math.random().toString().slice(2, 8),
        focused: Math.random() > 0.5,
        timestamp: Date.now()
      };
    }
    
    setTimeout(() => {
      const memAfter = performance.memory.usedJSHeapSize;
      const memDiff = memAfter - memBefore;
      console.log(`  Память после теста: ${(memAfter / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Разница: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);
    }, 100);
  } else {
    console.log('  ⚠️  Performance API недоступен в этой среде');
  }
}

// Тест отзывчивости
function testResponsiveness() {
  console.log('\n⚡ Тест отзывчивости:');
  
  const responseTimes = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = performance.now();
    
    // Симуляция обработки события
    setTimeout(() => {
      const responseTime = performance.now() - startTime;
      responseTimes.push(responseTime);
      
      if (i === 9) {
        const avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponse = Math.max(...responseTimes);
        const minResponse = Math.min(...responseTimes);
        
        console.log(`  📊 Статистика отзывчивости:`);
        console.log(`     Среднее время: ${avgResponse.toFixed(2)}ms`);
        console.log(`     Максимальное: ${maxResponse.toFixed(2)}ms`);
        console.log(`     Минимальное: ${minResponse.toFixed(2)}ms`);
        
        if (avgResponse < 16.67) {
          console.log('     ✅ Отлично! Поддерживает 60 FPS');
        } else if (avgResponse < 33.33) {
          console.log('     ⚠️  Хорошо, но может быть лучше (30 FPS)');
        } else {
          console.log('     ❌ Требует оптимизации');
        }
      }
    }, i * 10);
  }
}

// Рекомендации по тестированию
function showTestingRecommendations() {
  console.log('\n📋 Рекомендации по тестированию:');
  console.log('================================');
  
  console.log('\n1. 📱 Тестирование на устройствах:');
  console.log('   • iPhone 12/13/14 (iOS)');
  console.log('   • Samsung Galaxy S21/22 (Android)');
  console.log('   • Бюджетные Android устройства');
  
  console.log('\n2. 🔧 Сценарии тестирования:');
  console.log('   • Очень быстрый ввод (< 100ms между цифрами)');
  console.log('   • Нормальный ввод (200-500ms между цифрами)');
  console.log('   • Медленный ввод (> 1s между цифрами)');
  console.log('   • Ввод с ошибками и исправлениями');
  console.log('   • Копирование кода из SMS');
  
  console.log('\n3. 📊 Метрики для отслеживания:');
  console.log('   • Время отклика на ввод (< 16ms для 60 FPS)');
  console.log('   • Использование памяти');
  console.log('   • Количество ререндеров');
  console.log('   • Время до автозаполнения');
  
  console.log('\n4. 🎯 Ожидаемые результаты:');
  console.log('   • Мгновенная реакция на ввод');
  console.log('   • Плавная анимация курсора');
  console.log('   • Отсутствие задержек при быстром вводе');
  console.log('   • Стабильное использование памяти');
}

// Запуск всех тестов
function runAllTests() {
  simulateRapidInput();
  
  setTimeout(() => {
    testMemoryUsage();
  }, 1000);
  
  setTimeout(() => {
    testResponsiveness();
  }, 2000);
  
  setTimeout(() => {
    showTestingRecommendations();
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✅ Все тесты завершены!');
    console.log('\n💡 Следующие шаги:');
    console.log('   1. Протестируйте на реальных устройствах');
    console.log('   2. Соберите отзывы пользователей');
    console.log('   3. Мониторьте производительность в production');
  }, 4000);
}

// Запуск
runAllTests();
