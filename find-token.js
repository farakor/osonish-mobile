#!/usr/bin/env node

/**
 * Скрипт для поиска push токена в логах Metro
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 === ПОИСК PUSH ТОКЕНА ===\n');

// Функция для поиска токена в строке
function extractToken(line) {
  const tokenRegex = /ExponentPushToken\[[^\]]+\]/g;
  const matches = line.match(tokenRegex);
  return matches ? matches[0] : null;
}

// Функция для мониторинга логов Metro в реальном времени
function monitorMetroLogs() {
  console.log('📱 Мониторинг логов Metro...');
  console.log('💡 Откройте приложение и нажмите кнопку диагностики');
  console.log('⏹️  Нажмите Ctrl+C для остановки\n');

  const metro = spawn('npx', ['expo', 'start', '--no-dev', '--minify'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });

  let foundTokens = new Set();

  metro.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    lines.forEach(line => {
      const token = extractToken(line);
      if (token && !foundTokens.has(token)) {
        foundTokens.add(token);
        console.log('🎯 НАЙДЕН ТОКЕН:', token);
        console.log('📋 Скопируйте этот токен для тестирования\n');
        
        // Автоматически тестируем найденный токен
        testToken(token);
      }
    });
  });

  metro.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    lines.forEach(line => {
      const token = extractToken(line);
      if (token && !foundTokens.has(token)) {
        foundTokens.add(token);
        console.log('🎯 НАЙДЕН ТОКЕН:', token);
        console.log('📋 Скопируйте этот токен для тестирования\n');
        
        // Автоматически тестируем найденный токен
        testToken(token);
      }
    });
  });

  metro.on('close', (code) => {
    console.log(`\n📱 Metro завершен с кодом ${code}`);
    
    if (foundTokens.size === 0) {
      console.log('\n❌ Токены не найдены в логах');
      console.log('💡 Попробуйте:');
      console.log('   1. Открыть приложение в Expo Go');
      console.log('   2. Нажать кнопку диагностики');
      console.log('   3. Проверить консоль браузера (Debug mode)');
    } else {
      console.log(`\n✅ Найдено токенов: ${foundTokens.size}`);
      foundTokens.forEach(token => {
        console.log(`   ${token}`);
      });
    }
  });

  // Обработка Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️  Остановка мониторинга...');
    metro.kill();
    process.exit(0);
  });
}

// Функция для автоматического тестирования найденного токена
async function testToken(token) {
  console.log('🚀 Автоматическое тестирование токена...');
  
  try {
    const { spawn } = require('child_process');
    
    const test = spawn('node', ['test-fcm-production.js', token], {
      stdio: 'inherit'
    });
    
    test.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Тест токена завершен успешно\n');
      } else {
        console.log('❌ Тест токена завершен с ошибкой\n');
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Функция для поиска в существующих логах
function searchExistingLogs() {
  console.log('🔍 Поиск в существующих файлах логов...\n');
  
  const logPaths = [
    '.expo/logs',
    'node_modules/.cache/expo',
    '/tmp/expo-logs'
  ];
  
  let foundAny = false;
  
  logPaths.forEach(logPath => {
    if (fs.existsSync(logPath)) {
      console.log(`📁 Проверяем: ${logPath}`);
      
      try {
        const files = fs.readdirSync(logPath);
        
        files.forEach(file => {
          if (file.includes('log') || file.includes('metro')) {
            const filePath = path.join(logPath, file);
            
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const token = extractToken(content);
              
              if (token) {
                console.log(`🎯 Найден токен в ${filePath}:`);
                console.log(`   ${token}\n`);
                foundAny = true;
              }
            } catch (error) {
              // Игнорируем ошибки чтения файлов
            }
          }
        });
      } catch (error) {
        // Игнорируем ошибки чтения директории
      }
    }
  });
  
  if (!foundAny) {
    console.log('❌ Токены в существующих логах не найдены\n');
  }
}

// Основная функция
function main() {
  const command = process.argv[2];
  
  if (command === 'monitor') {
    monitorMetroLogs();
  } else if (command === 'search') {
    searchExistingLogs();
  } else {
    console.log('📋 Доступные команды:');
    console.log('');
    console.log('🔍 Поиск в существующих логах:');
    console.log('   node find-token.js search');
    console.log('');
    console.log('📱 Мониторинг новых логов:');
    console.log('   node find-token.js monitor');
    console.log('');
    console.log('💡 Альтернативные способы:');
    console.log('   1. Кнопка диагностики в приложении');
    console.log('   2. Консоль браузера (Debug mode)');
    console.log('   3. Логи Metro в терминале');
    console.log('');
  }
}

main();
