import i18n from '../i18n';
import { Language } from '../contexts/LanguageContext';

export interface NotificationTranslation {
  title: string;
  body: string;
}

export class TranslationService {
  /**
 * Переводит уведомление на указанный язык
 */
  static translateNotification(
    titleKey: string,
    bodyKey: string,
    language: Language,
    params?: Record<string, any>
  ): NotificationTranslation {
    const title = this.translateText(titleKey, language, params);
    const body = this.translateText(bodyKey, language, params);

    return { title, body };
  }

  /**
   * Получает переводы уведомления для всех поддерживаемых языков
   */
  static getMultiLanguageNotification(
    titleKey: string,
    bodyKey: string,
    params?: Record<string, any>
  ): Record<Language, NotificationTranslation> {
    return {
      ru: this.translateNotification(titleKey, bodyKey, 'ru', params),
      uz: this.translateNotification(titleKey, bodyKey, 'uz', params),
    };
  }

  /**
 * Переводит текст на указанный язык
 */
  static translateText(key: string, language: Language, params?: Record<string, any>): string {
    // Используем прямой доступ к ресурсам вместо смены языка
    const resources = i18n.getResourceBundle(language, 'translation');
    if (!resources) {
      return key;
    }

    // Простая функция для получения значения по ключу
    const getValue = (obj: any, path: string): string => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || key;
    };

    let translation = getValue(resources, key);

    // Простая интерполяция параметров
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
      });
    }

    return translation;
  }

  /**
   * Получает текущий язык
   */
  static getCurrentLanguage(): Language {
    return i18n.language as Language;
  }

  /**
   * Проверяет, поддерживается ли язык
   */
  static isLanguageSupported(language: string): language is Language {
    return ['ru', 'uz'].includes(language);
  }

  /**
   * Форматирует дату согласно локали
   */
  static formatDate(date: Date, language: Language): string {
    const locale = language === 'uz' ? 'uz-UZ' : 'ru-RU';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Форматирует время согласно локали
   */
  static formatTime(date: Date, language: Language): string {
    const locale = language === 'uz' ? 'uz-UZ' : 'ru-RU';

    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Форматирует дату и время согласно локали
   */
  static formatDateTime(date: Date, language: Language): string {
    const locale = language === 'uz' ? 'uz-UZ' : 'ru-RU';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Форматирует число согласно локали
   */
  static formatNumber(number: number, language: Language): string {
    const locale = language === 'uz' ? 'uz-UZ' : 'ru-RU';

    return new Intl.NumberFormat(locale).format(number);
  }

  /**
   * Форматирует валюту согласно локали
   */
  static formatCurrency(amount: number, language: Language, currency: string = 'UZS'): string {
    const locale = language === 'uz' ? 'uz-UZ' : 'ru-RU';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export const translationService = TranslationService;
