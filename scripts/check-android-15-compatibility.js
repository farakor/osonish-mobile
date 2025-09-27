#!/usr/bin/env node

/**
 * Скрипт для проверки совместимости с Android 15+
 * Проверяет исправления для Google Play
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка совместимости с Android 15+...\n');

// Проверяем app.json
function checkAppJson() {
  console.log('📱 Проверка app.json...');
  
  try {
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const android = appJson.expo.android;
    const orientation = appJson.expo.orientation;
    
    // Проверка ориентации
    if (orientation === 'default') {
      console.log('  ✅ Ориентация экрана: default (поддержка больших экранов)');
    } else {
      console.log('  ❌ Ориентация экрана: ' + orientation + ' (должна быть default)');
    }
    
    // Проверка Edge-to-Edge
    if (android.enableEdgeToEdge === true) {
      console.log('  ✅ Edge-to-Edge: включен');
    } else {
      console.log('  ❌ Edge-to-Edge: не настроен');
    }
    
    // Проверка statusBarStyle
    if (android.statusBarStyle === 'auto') {
      console.log('  ✅ StatusBar стиль: auto');
    } else {
      console.log('  ⚠️  StatusBar стиль: ' + (android.statusBarStyle || 'не задан'));
    }
    
    // Проверка navigationBarStyle
    if (android.navigationBarStyle === 'auto') {
      console.log('  ✅ NavigationBar стиль: auto');
    } else {
      console.log('  ⚠️  NavigationBar стиль: ' + (android.navigationBarStyle || 'не задан'));
    }
    
  } catch (error) {
    console.log('  ❌ Ошибка чтения app.json:', error.message);
  }
  
  console.log('');
}

// Проверяем использование устаревших API
function checkDeprecatedAPIs() {
  console.log('🔧 Проверка устаревших API...');
  
  const srcPath = path.join(__dirname, '../src');
  const deprecatedAPIs = [
    'StatusBar.currentHeight',
    'StatusBar.setColor',
    'StatusBar.setBackgroundColor',
    'StatusBar.setNavigationBarColor',
    'getStatusBarColor',
    'setStatusBarColor',
    'setNavigationBarColor'
  ];
  
  let foundIssues = 0;
  
  function checkFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      deprecatedAPIs.forEach(api => {
        if (content.includes(api)) {
          console.log(`  ⚠️  Найден устаревший API "${api}" в ${path.relative(srcPath, filePath)}`);
          foundIssues++;
        }
      });
      
    } catch (error) {
      // Игнорируем ошибки чтения файлов
    }
  }
  
  function walkDir(dir) {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          checkFile(filePath);
        }
      });
    } catch (error) {
      // Игнорируем ошибки чтения директорий
    }
  }
  
  walkDir(srcPath);
  
  if (foundIssues === 0) {
    console.log('  ✅ Устаревшие API не найдены');
  } else {
    console.log(`  ❌ Найдено ${foundIssues} использований устаревших API`);
  }
  
  console.log('');
}

// Проверяем новые утилиты
function checkNewUtilities() {
  console.log('🛠️  Проверка новых утилит...');
  
  const edgeToEdgeUtilsPath = path.join(__dirname, '../src/utils/edgeToEdgeUtils.ts');
  const edgeToEdgeStatusBarPath = path.join(__dirname, '../src/components/common/EdgeToEdgeStatusBar.tsx');
  
  if (fs.existsSync(edgeToEdgeUtilsPath)) {
    console.log('  ✅ edgeToEdgeUtils.ts создан');
  } else {
    console.log('  ❌ edgeToEdgeUtils.ts не найден');
  }
  
  if (fs.existsSync(edgeToEdgeStatusBarPath)) {
    console.log('  ✅ EdgeToEdgeStatusBar.tsx создан');
  } else {
    console.log('  ❌ EdgeToEdgeStatusBar.tsx не найден');
  }
  
  console.log('');
}

// Проверяем зависимости
function checkDependencies() {
  console.log('📦 Проверка зависимостей...');
  
  try {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'react-native-safe-area-context',
      'expo-status-bar'
    ];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        console.log(`  ❌ ${dep}: не найден`);
      }
    });
    
  } catch (error) {
    console.log('  ❌ Ошибка чтения package.json:', error.message);
  }
  
  console.log('');
}

// Рекомендации по тестированию
function showTestingRecommendations() {
  console.log('🧪 Рекомендации по тестированию:');
  console.log('');
  console.log('1. Тестирование на Android 15+:');
  console.log('   - Проверить Edge-to-Edge режим');
  console.log('   - Убедиться в корректных отступах');
  console.log('   - Проверить прозрачность статус-бара');
  console.log('');
  console.log('2. Тестирование на больших экранах:');
  console.log('   - Складные телефоны (Galaxy Fold, Pixel Fold)');
  console.log('   - Планшеты (iPad, Galaxy Tab)');
  console.log('   - Смена ориентации экрана');
  console.log('');
  console.log('3. Тестирование обратной совместимости:');
  console.log('   - Android 10-14');
  console.log('   - Различные размеры экранов');
  console.log('   - Различные плотности пикселей');
  console.log('');
  console.log('4. Команды для сборки:');
  console.log('   npx eas build --platform android --profile preview');
  console.log('   npx expo start --android');
  console.log('');
}

// Запуск всех проверок
function runAllChecks() {
  checkAppJson();
  checkDeprecatedAPIs();
  checkNewUtilities();
  checkDependencies();
  showTestingRecommendations();
  
  console.log('✨ Проверка завершена!');
  console.log('');
  console.log('📋 Следующие шаги:');
  console.log('1. Исправить найденные проблемы (если есть)');
  console.log('2. Протестировать на реальных устройствах');
  console.log('3. Собрать и загрузить в Google Play');
  console.log('');
}

// Запуск
runAllChecks();
