import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStoragePlugin from 'i18next-react-native-async-storage';

// Импортируем переводы
import ru from './locales/ru.json';
import uz from './locales/uz.json';

const resources = {
  ru: {
    translation: ru,
  },
  uz: {
    translation: uz,
  },
};

i18n
  .use(AsyncStoragePlugin('osonish_language'))
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    debug: __DEV__,

    interpolation: {
      escapeValue: false, // React уже экранирует значения
    },

    react: {
      useSuspense: false,
    },

    // Настройки для AsyncStorage
    cache: {
      enabled: true,
    },
  });

export default i18n;
