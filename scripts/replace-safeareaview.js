#!/usr/bin/env node

/**
 * Скрипт для замены устаревшего SafeAreaView на react-native-safe-area-context
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Замена устаревшего SafeAreaView...\n');

const srcPath = path.join(__dirname, '../src');
let filesProcessed = 0;
let filesChanged = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;
    
    // Заменяем импорт SafeAreaView из react-native
    const oldImportPattern = /import\s*{\s*([^}]*),?\s*SafeAreaView\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-native['"]/g;
    const newImportReplacement = (match, before, after) => {
      hasChanges = true;
      
      // Очищаем пустые запятые
      const beforeClean = before ? before.replace(/,\s*$/, '').trim() : '';
      const afterClean = after ? after.replace(/^\s*,/, '').trim() : '';
      
      let imports = [];
      if (beforeClean) imports.push(beforeClean);
      if (afterClean) imports.push(afterClean);
      
      const reactNativeImport = imports.length > 0 ? `import { ${imports.join(', ')} } from 'react-native';` : '';
      const safeAreaImport = `import { SafeAreaView } from 'react-native-safe-area-context';`;
      
      return reactNativeImport ? `${reactNativeImport}\n${safeAreaImport}` : safeAreaImport;
    };
    
    newContent = newContent.replace(oldImportPattern, newImportReplacement);
    
    // Также проверяем случай, когда SafeAreaView импортируется отдельно
    const separateImportPattern = /import\s*{\s*SafeAreaView\s*}\s*from\s*['"]react-native['"]/g;
    if (separateImportPattern.test(content)) {
      newContent = newContent.replace(separateImportPattern, `import { SafeAreaView } from 'react-native-safe-area-context';`);
      hasChanges = true;
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Обновлен: ${path.relative(srcPath, filePath)}`);
      filesChanged++;
    }
    
    filesProcessed++;
    
  } catch (error) {
    console.error(`❌ Ошибка обработки ${filePath}:`, error.message);
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
        processFile(filePath);
      }
    });
  } catch (error) {
    console.error(`❌ Ошибка чтения директории ${dir}:`, error.message);
  }
}

// Запуск обработки
walkDir(srcPath);

console.log(`\n📊 Результаты:`);
console.log(`   Файлов обработано: ${filesProcessed}`);
console.log(`   Файлов изменено: ${filesChanged}`);

if (filesChanged > 0) {
  console.log(`\n✨ Замена SafeAreaView завершена успешно!`);
  console.log(`\n📋 Следующие шаги:`);
  console.log(`1. Проверьте изменения в файлах`);
  console.log(`2. Убедитесь, что все импорты корректны`);
  console.log(`3. Протестируйте приложение`);
} else {
  console.log(`\n✅ Все файлы уже используют правильный SafeAreaView`);
}

console.log('');
