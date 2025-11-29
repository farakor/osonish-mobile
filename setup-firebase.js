#!/usr/bin/env node

/**
 * 🔥 Скрипт автоматической настройки Firebase для Osonish
 * 
 * Этот скрипт поможет настроить Firebase проект для push уведомлений
 * 
 * Использование:
 * node setup-firebase.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 === НАСТРОЙКА FIREBASE ДЛЯ OSONISH ===\n');

// Проверяем наличие google-services.json
function checkGoogleServicesFile() {
  const filePath = path.join(__dirname, 'google-services.json');
  
  if (fs.existsSync(filePath)) {
    console.log('✅ Файл google-services.json найден');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);
      
      console.log('📋 Информация о проекте:');
      console.log(`   - Project ID: ${config.project_info?.project_id || 'не найден'}`);
      console.log(`   - Project Number: ${config.project_info?.project_number || 'не найден'}`);
      console.log(`   - Package Name: ${config.client?.[0]?.client_info?.android_client_info?.package_name || 'не найден'}`);
      
      // Проверяем package name
      const expectedPackageName = 'com.farakor.osonishmobile';
      const actualPackageName = config.client?.[0]?.client_info?.android_client_info?.package_name;
      
      if (actualPackageName === expectedPackageName) {
        console.log('✅ Package name корректный');
      } else {
        console.log('❌ Package name не соответствует ожидаемому:');
        console.log(`   Ожидается: ${expectedPackageName}`);
        console.log(`   Найден: ${actualPackageName}`);
        console.log('⚠️  Пожалуйста, пересоздайте Firebase проект с правильным package name');
      }
      
      return true;
    } catch (error) {
      console.log('❌ Ошибка чтения google-services.json:', error.message);
      return false;
    }
  } else {
    console.log('❌ Файл google-services.json не найден');
    console.log('\n📋 Инструкции по получению файла:');
    console.log('1. Перейдите на https://console.firebase.google.com/');
    console.log('2. Создайте новый проект или выберите существующий');
    console.log('3. Добавьте Android приложение с package name: com.farakor.osonishmobile');
    console.log('4. Скачайте google-services.json');
    console.log('5. Поместите файл в корень проекта: osonish-mobile/google-services.json');
    console.log('6. Запустите этот скрипт снова\n');
    return false;
  }
}

// Проверяем установку EAS CLI
function checkEASCLI() {
  try {
    execSync('npx eas --version', { stdio: 'pipe' });
    console.log('✅ EAS CLI доступен');
    return true;
  } catch (error) {
    console.log('❌ EAS CLI не установлен');
    console.log('Установка: npm install -g @expo/eas-cli');
    return false;
  }
}

// Проверяем авторизацию в Expo
function checkExpoAuth() {
  try {
    const result = execSync('npx eas whoami', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Авторизован в Expo как:', result.trim());
    return true;
  } catch (error) {
    console.log('❌ Не авторизован в Expo');
    console.log('Выполните: npx eas login');
    return false;
  }
}

// Проверяем конфигурацию app.json
function checkAppConfig() {
  const appJsonPath = path.join(__dirname, 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.log('❌ Файл app.json не найден');
    return false;
  }
  
  try {
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const config = JSON.parse(content);
    
    const androidConfig = config.expo?.android;
    const iosConfig = config.expo?.ios;
    
    console.log('📱 Конфигурация приложения:');
    console.log(`   - Android package: ${androidConfig?.package || 'не настроен'}`);
    console.log(`   - iOS bundle ID: ${iosConfig?.bundleIdentifier || 'не настроен'}`);
    console.log(`   - Google Services File: ${androidConfig?.googleServicesFile || 'не настроен'}`);
    
    // Проверяем необходимые поля
    const issues = [];
    
    if (androidConfig?.package !== 'com.farakor.osonishmobile') {
      issues.push('Android package name должен быть: com.farakor.osonishmobile');
    }
    
    if (iosConfig?.bundleIdentifier !== 'com.farakor.osonishmobile') {
      issues.push('iOS bundle identifier должен быть: com.farakor.osonishmobile');
    }
    
    if (androidConfig?.googleServicesFile !== './google-services.json') {
      issues.push('googleServicesFile должен указывать на ./google-services.json');
    }
    
    if (issues.length > 0) {
      console.log('⚠️  Найдены проблемы в конфигурации:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      return false;
    }
    
    console.log('✅ Конфигурация app.json корректна');
    return true;
  } catch (error) {
    console.log('❌ Ошибка чтения app.json:', error.message);
    return false;
  }
}

// Настройка Android credentials
function setupAndroidCredentials() {
  console.log('\n🤖 Настройка Android credentials...');
  
  try {
    console.log('Запуск: npx eas credentials:configure --platform android');
    console.log('\n📋 Инструкции:');
    console.log('1. Выберите "Set up Google Service Account Key" если спросят');
    console.log('2. Выберите "Generate new Android Keystore" для нового проекта');
    console.log('3. Или загрузите существующий keystore если он у вас есть');
    
    // Не выполняем автоматически, так как требует интерактивного ввода
    console.log('\n⚠️  Выполните команду вручную:');
    console.log('npx eas credentials:configure --platform android');
    
  } catch (error) {
    console.log('❌ Ошибка настройки Android credentials:', error.message);
  }
}

// Настройка iOS credentials
function setupIOSCredentials() {
  console.log('\n🍎 Настройка iOS credentials...');
  
  console.log('📋 Для iOS вам понадобится:');
  console.log('1. Apple Developer Account ($99/год)');
  console.log('2. APNs Key (.p8 файл) из Apple Developer Console');
  console.log('3. Key ID и Team ID');
  
  console.log('\n⚠️  После получения Apple Developer Account выполните:');
  console.log('npx eas credentials:configure --platform ios');
}

// Создание тестового билда
function suggestTestBuild() {
  console.log('\n🔨 Создание тестового билда:');
  console.log('\n📋 После настройки credentials выполните:');
  console.log('# Для Android:');
  console.log('npx eas build --platform android --profile preview');
  console.log('\n# Для iOS (требует Apple Developer Account):');
  console.log('npx eas build --platform ios --profile preview');
  console.log('\n# Для обеих платформ:');
  console.log('npx eas build --platform all --profile preview');
}

// Создание .gitignore записей
function updateGitignore() {
  const gitignorePath = path.join(__dirname, '.gitignore');
  
  const entriesToAdd = [
    '# Firebase',
    'google-services.json',
    'GoogleService-Info.plist',
    '',
    '# Apple',
    '*.p8',
    '*.p12',
    '',
    '# Google',
    'google-service-account.json',
    '*.json.key'
  ];
  
  try {
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    // Проверяем, есть ли уже записи
    const hasFirebaseEntries = gitignoreContent.includes('google-services.json');
    
    if (!hasFirebaseEntries) {
      gitignoreContent += '\n' + entriesToAdd.join('\n') + '\n';
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ .gitignore обновлен (добавлены Firebase записи)');
    } else {
      console.log('✅ .gitignore уже содержит Firebase записи');
    }
  } catch (error) {
    console.log('⚠️  Не удалось обновить .gitignore:', error.message);
    console.log('Добавьте вручную в .gitignore:');
    entriesToAdd.forEach(entry => console.log(entry));
  }
}

// Основная функция
async function main() {
  console.log('Проверяем готовность к настройке Firebase...\n');
  
  let allChecksPass = true;
  
  // Проверяем файлы и конфигурацию
  if (!checkGoogleServicesFile()) allChecksPass = false;
  if (!checkAppConfig()) allChecksPass = false;
  if (!checkEASCLI()) allChecksPass = false;
  if (!checkExpoAuth()) allChecksPass = false;
  
  // Обновляем .gitignore
  updateGitignore();
  
  if (allChecksPass) {
    console.log('\n🎉 Все проверки пройдены! Готов к настройке credentials.');
    setupAndroidCredentials();
    setupIOSCredentials();
    suggestTestBuild();
  } else {
    console.log('\n❌ Есть проблемы, которые нужно исправить перед продолжением.');
    console.log('Исправьте указанные выше проблемы и запустите скрипт снова.');
  }
  
  console.log('\n📚 Дополнительные ресурсы:');
  console.log('- Firebase Console: https://console.firebase.google.com/');
  console.log('- Apple Developer: https://developer.apple.com/');
  console.log('- EAS Build Docs: https://docs.expo.dev/build/introduction/');
  console.log('- Push Notifications Guide: https://docs.expo.dev/push-notifications/');
  
  console.log('\n✅ Настройка Firebase завершена!');
}

// Запуск
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkGoogleServicesFile,
  checkEASCLI,
  checkExpoAuth,
  checkAppConfig
};
