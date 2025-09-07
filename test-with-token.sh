#!/bin/bash

echo "🔍 Получите push токен из приложения:"
echo "   1. Откройте приложение в Expo Go"
echo "   2. Нажмите кнопку 'Полная диагностика'"
echo "   3. Найдите строку с токеном: ExponentPushToken[...]"
echo "   4. Скопируйте ПОЛНЫЙ токен"
echo ""
echo "📱 Затем выполните:"
echo "   node test-fcm-production.js \"ExponentPushToken[ваш-полный-токен]\""
echo ""
echo "🚀 Или используйте быстрый тест:"
echo "   npm run test-notifications \"ExponentPushToken[ваш-полный-токен]\""
