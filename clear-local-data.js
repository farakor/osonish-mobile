#!/usr/bin/env node

/**
 * Скрипт для очистки локальных данных приложения
 * Запуск: node clear-local-data.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Очистка локальных кешей и данных...\n');

// 1. Очистка Metro cache
console.log('1️⃣ Очищаем кеш Metro...');
try {
  execSync('npx react-native start --reset-cache', { stdio: 'pipe' });
  console.log('✅ Metro кеш очищен');
} catch (error) {
  console.log('ℹ️ Metro кеш: команда выполнена');
}

// 2. Очистка node_modules cache
console.log('\n2️⃣ Очищаем npm кеш...');
try {
  execSync('npm cache clean --force', { stdio: 'pipe' });
  console.log('✅ NPM кеш очищен');
} catch (error) {
  console.log('⚠️ Ошибка очистки npm кеша:', error.message);
}

// 3. Очистка временных файлов
console.log('\n3️⃣ Очищаем временные файлы...');
const tempPaths = [
  './android/app/build',
  './ios/build',
  './.expo',
  './dist',
  './build'
];

tempPaths.forEach(tempPath => {
  if (fs.existsSync(tempPath)) {
    try {
      execSync(`rm -rf ${tempPath}`, { stdio: 'pipe' });
      console.log(`✅ Удален: ${tempPath}`);
    } catch (error) {
      console.log(`⚠️ Не удалось удалить: ${tempPath}`);
    }
  } else {
    console.log(`ℹ️ Не найден: ${tempPath}`);
  }
});

// 4. Watchman cache (если установлен)
console.log('\n4️⃣ Очищаем Watchman кеш...');
try {
  execSync('watchman watch-del-all', { stdio: 'pipe' });
  console.log('✅ Watchman кеш очищен');
} catch (error) {
  console.log('ℹ️ Watchman не установлен или уже очищен');
}

console.log('\n🎉 Очистка локальных кешей завершена!');
console.log('\n📝 Что было очищено:');
console.log('   - Metro cache');
console.log('   - NPM cache'); 
console.log('   - Временные файлы сборки');
console.log('   - Watchman cache');
console.log('\n💡 Для очистки AsyncStorage данных в приложении используйте:');
console.log('   clearLocalDataOnly() в консоли разработчика');
console.log('\n🚀 Теперь можно перезапустить приложение:');
console.log('   npx react-native start');