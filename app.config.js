// app.config.js - Конфигурация для Expo с поддержкой переменных окружения
// Поддерживает как локальную разработку (.env), так и EAS Build (process.env)

const fs = require("fs");
const path = require("path");

// Функция для загрузки .env файла вручную (только для локальной разработки)
function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      return {};
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
      // Пропускаем комментарии и пустые строки
      if (line.trim().startsWith("#") || !line.trim()) {
        return;
      }

      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Убираем кавычки если есть
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        envVars[key] = value;
      }
    });

    return envVars;
  } catch (error) {
    console.error("❌ Ошибка загрузки .env файла:", error);
    return {};
  }
}

// Загружаем переменные из .env файла (если существует)
const envPath = path.resolve(__dirname, ".env");
const fileEnvVars = loadEnvFile(envPath);

// Объединяем переменные: приоритет у process.env (для EAS Build)
const envVars = {
  EXPO_PUBLIC_SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    fileEnvVars.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    fileEnvVars.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    fileEnvVars.SUPABASE_SERVICE_ROLE_KEY,
  ESKIZ_EMAIL: process.env.ESKIZ_EMAIL || fileEnvVars.ESKIZ_EMAIL,
  ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD || fileEnvVars.ESKIZ_PASSWORD,
  ESKIZ_BASE_URL: process.env.ESKIZ_BASE_URL || fileEnvVars.ESKIZ_BASE_URL,
  SMS_SENDER_NAME: process.env.SMS_SENDER_NAME || fileEnvVars.SMS_SENDER_NAME,
  FORCE_PRODUCTION_SMS:
    process.env.FORCE_PRODUCTION_SMS || fileEnvVars.FORCE_PRODUCTION_SMS,
  EXPO_PUBLIC_FIREBASE_API_KEY:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    fileEnvVars.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔧 [app.config.js] Загружаем конфигурацию...");
console.log(
  "📁 [app.config.js] Режим:",
  process.env.EAS_BUILD ? "EAS Build" : "Локальная разработка"
);
console.log(
  "🔑 [app.config.js] Supabase URL:",
  envVars.EXPO_PUBLIC_SUPABASE_URL ? "✓" : "✗"
);
console.log(
  "🔑 [app.config.js] Supabase Anon Key:",
  envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗"
);

// Загружаем базовую конфигурацию из app.json
const appJson = require("./app.json");

// Добавляем переменные окружения в extra
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    // Добавляем переменные окружения
    supabaseUrl: envVars.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: envVars.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    // Остальные переменные
    eskizEmail: envVars.ESKIZ_EMAIL,
    eskizPassword: envVars.ESKIZ_PASSWORD,
    eskizBaseUrl: envVars.ESKIZ_BASE_URL,
    smsSenderName: envVars.SMS_SENDER_NAME,
    forceProductionSms: envVars.FORCE_PRODUCTION_SMS,
    firebaseApiKey: envVars.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: envVars.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: envVars.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: envVars.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: envVars.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: envVars.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
};
