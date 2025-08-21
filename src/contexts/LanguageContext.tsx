import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

export type Language = 'ru' | 'uz';

interface LanguageContextType {
  currentLanguage: Language;
  changeLanguage: (language: Language) => Promise<void>;
  isLanguageSelected: boolean;
  setLanguageSelected: (selected: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'osonish_selected_language';
const LANGUAGE_SELECTION_KEY = 'osonish_language_selected';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('ru');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const [savedLanguage, languageSelected] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
        AsyncStorage.getItem(LANGUAGE_SELECTION_KEY)
      ]);

      if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'uz')) {
        setCurrentLanguage(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      }

      if (languageSelected === 'true') {
        setIsLanguageSelected(true);
      }
    } catch (error) {
      console.error('Error loading language settings:', error);
    }
  };

  const changeLanguage = async (language: Language) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language),
        AsyncStorage.setItem(LANGUAGE_SELECTION_KEY, 'true'),
        i18n.changeLanguage(language)
      ]);

      setCurrentLanguage(language);
      setIsLanguageSelected(true);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  const setLanguageSelected = async (selected: boolean) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_SELECTION_KEY, selected.toString());
      setIsLanguageSelected(selected);
    } catch (error) {
      console.error('Error setting language selection status:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isLanguageSelected,
        setLanguageSelected,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
