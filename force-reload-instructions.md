# 🔄 ПРИНУДИТЕЛЬНАЯ ПЕРЕЗАГРУЗКА ПРИЛОЖЕНИЯ

## 📱 На физическом устройстве (iOS/Android):
1. **Встряхните устройство** или нажмите **Cmd+D** (iOS) / **Cmd+M** (Android)
2. В меню разработчика выберите **"Reload"** или **"Refresh"**
3. Или выберите **"Debug Remote JS"** → **"Reload"**

## 💻 В эмуляторе:
### iOS Simulator:
- **Cmd+R** - перезагрузка
- **Device → Shake** - меню разработчика

### Android Emulator:
- **Cmd+R** или **R+R** - перезагрузка
- **Cmd+M** - меню разработчика

## 🔧 Альтернативный способ:
1. **Закройте приложение полностью** (не сворачивайте, а закройте)
2. **Откройте заново** из Expo Go или эмулятора

## ✅ После перезагрузки должны появиться логи:
```
[AuthService] 🔄 Модуль authService загружается...
[AuthService] 📦 eskizSMSService импортирован: true
[EskizSMS] 🔧 Конфигурация Eskiz: {
  email: "info@oson-ish.uz",
  password: "O0gKE3R1MLVT8JRwbXnQf70TuIvLhHrekjEiwu6g",
  ...
}
```

## ❌ Если логи все еще не появляются:
Значит Metro bundler не перезагрузил файлы. Попробуйте:
1. Полностью закрыть Expo CLI (Ctrl+C в терминале)
2. Запустить `npx expo start --clear --reset-cache`
3. Переоткрыть приложение
