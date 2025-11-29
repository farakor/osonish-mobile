#!/bin/bash
echo "Остановка Metro bundler..."
pkill -f "node.*react-native.*start" || true

echo "Очистка кэша..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

echo "Запуск Metro bundler с очисткой кэша..."
npm start -- --reset-cache
