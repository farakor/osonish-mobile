# Исправление модального окна согласия на обработку ПД для Android

## Проблема
На экране регистрации (`ProfileInfoStepByStepScreen`) на Android устройствах не открывалось окно со ссылкой на документ согласия на обработку персональных данных. В то время как на экране профиля это работало корректно.

## Причина
Проблема была в использовании `WebViewModal` для отображения веб-страницы с согласием. На Android в контексте экрана регистрации WebView может иметь проблемы с рендерингом в модальных окнах.

## Решение
Заменили `WebViewModal` на `CustomPrivacyModal` специально для Android устройств:

### Изменения в `ProfileInfoStepByStepScreen.tsx`:

1. **Добавлен импорт CustomPrivacyModal:**
```typescript
import { WebViewModal, LogoOsonish, CustomPrivacyModal } from '../../components/common';
```

2. **Добавлено состояние для CustomPrivacyModal:**
```typescript
const [showPrivacyModal, setShowPrivacyModal] = useState(false);
```

3. **Добавлена функция с проверкой платформы:**
```typescript
const handleOpenPrivacyModal = () => {
  if (Platform.OS === 'android') {
    setShowPrivacyModal(true);
  } else {
    handleOpenWebView('https://oson-ish.uz/privacy-policy.html', t('privacy_document_title'));
  }
};
```

4. **Заменен обработчик в кнопке:**
```typescript
<TouchableOpacity
  style={styles.privacyDocumentButton}
  onPress={handleOpenPrivacyModal}  // Было: () => handleOpenWebView(...)
>
```

5. **Добавлен CustomPrivacyModal в JSX:**
```typescript
<CustomPrivacyModal
  visible={showPrivacyModal}
  onClose={handleClosePrivacyModal}
  onAccept={handleClosePrivacyModal}
  privacyAccepted={privacyAccepted}
/>
```

## Результат
- **Android**: Использует `CustomPrivacyModal` с нативной анимацией и полным текстом согласия
- **iOS**: Продолжает использовать `WebViewModal` для загрузки веб-страницы
- Обеспечена кроссплатформенная совместимость
- Улучшена производительность на Android

## Тестирование
1. Запустите приложение на Android устройстве
2. Перейдите к экрану регистрации
3. Дойдите до шага 6 (согласие на обработку ПД)
4. Нажмите на кнопку "Согласие на обработку ПД"
5. Убедитесь, что открывается модальное окно с текстом согласия
6. Проверьте работу кнопки "Закрыть"

## Финальное решение: Точная копия экрана профиля

### Проблема
WebViewModal на Android отображался некорректно из-за неправильного позиционирования в структуре компонентов.

### Решение
Скопирована точная реализация с экрана профиля:

#### Изменения в `ProfileInfoStepByStepScreen.tsx`:

1. **Импорт как в профиле:**
```typescript
import { WebViewModal, LogoOsonish } from '../../components/common';
```

2. **Состояние webViewModal как в профиле:**
```typescript
const [webViewModal, setWebViewModal] = useState<{
  visible: boolean;
  url: string;
  title: string;
}>({
  visible: false,
  url: '',
  title: '',
});
```

3. **Функции как в профиле:**
```typescript
const handleOpenWebView = (url: string, title: string) => {
  setWebViewModal({
    visible: true,
    url,
    title,
  });
};

const handleCloseWebView = () => {
  setWebViewModal({
    visible: false,
    url: '',
    title: '',
  });
};

const handleOpenPrivacyModal = () => {
  handleOpenWebView('https://oson-ish.uz/privacy-policy.html', t('privacy_document_title'));
};
```

4. **WebViewModal вынесен за пределы KeyboardAvoidingView:**
```typescript
</SafeAreaView>

{/* WebView Modal */}
<WebViewModal
  visible={webViewModal.visible}
  url={webViewModal.url}
  title={webViewModal.title}
  onClose={handleCloseWebView}
/>
</View>
```

## Результат
- ✅ **Единообразие**: Точно такая же реализация как в экране профиля
- ✅ **Кроссплатформенность**: WebViewModal работает корректно на всех платформах
- ✅ **Актуальный контент**: Загружается с сайта https://oson-ish.uz/privacy-policy.html
- ✅ **Правильное позиционирование**: WebViewModal вынесен за пределы KeyboardAvoidingView
- ✅ **Упрощенный код**: Убрана лишняя сложность и дублирование

## Файлы изменены
- `osonish-mobile/src/screens/auth/ProfileInfoStepByStepScreen.tsx`
