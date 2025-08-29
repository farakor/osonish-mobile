/**
 * Интеграция Supabase Auth с SMS верификацией через Eskiz.uz
 * Объединяет Supabase аутентификацию с кастомной SMS верификацией
 */

import { supabase } from './supabaseClient';
import { eskizSMSService } from './eskizSMSService';
import { smsService } from './smsService';
import { smsConfig } from '../config/smsConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SupabaseAuthUser {
  id: string;
  phone: string;
  email?: string;
  user_metadata?: any;
  app_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SupabaseAuthUser;
}

export interface PhoneAuthRequest {
  phone: string;
  options?: {
    data?: any; // Дополнительные данные пользователя
  };
}

export interface PhoneVerifyRequest {
  phone: string;
  token: string; // SMS код
  options?: {
    data?: any;
  };
}

export interface AuthResponse {
  success: boolean;
  user?: SupabaseAuthUser;
  session?: SupabaseAuthSession;
  error?: string;
}

class SupabaseAuthService {
  private readonly STORAGE_KEY = '@osonish_supabase_phone_auth';

  /**
   * Получение активного SMS сервиса
   */
  private getSMSService() {
    switch (smsConfig.provider) {
      case 'eskiz':
        return eskizSMSService;
      case 'twilio':
      default:
        return smsService;
    }
  }

  /**
   * Форматирование номера телефона
   */
  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('998')) {
      return '+' + digits;
    }

    if (digits.startsWith('8') && digits.length === 10) {
      return '+998' + digits.slice(1);
    }

    if (digits.startsWith('9') && digits.length === 9) {
      return '+998' + digits;
    }

    return phone;
  }

  /**
   * Создание или получение пользователя в Supabase по номеру телефона
   */
  private async getOrCreateUserByPhone(phone: string, userData?: any): Promise<{ user: SupabaseAuthUser | null; error?: string }> {
    try {
      if (!supabase) {
        return { user: null, error: 'Supabase клиент не доступен' };
      }

      const formattedPhone = this.formatPhoneNumber(phone);

      // Сначала пытаемся найти пользователя в таблице users
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', formattedPhone)
        .single();

      if (existingUser && !fetchError) {
        console.log('[SupabaseAuth] 👤 Найден существующий пользователь:', existingUser.id);
        return { user: existingUser };
      }

      // Если пользователь не найден, создаем нового
      console.log('[SupabaseAuth] 👤 Создание нового пользователя для номера:', formattedPhone);

      const newUserData = {
        phone: formattedPhone,
        first_name: userData?.firstName || 'Пользователь',
        last_name: userData?.lastName || 'Oson Ish',
        middle_name: userData?.middleName || null,
        birth_date: userData?.birthDate || '1990-01-01', // Обязательное поле
        role: userData?.role || 'customer',
        profile_image: userData?.profileImage || null,
        city: userData?.city || null,
        preferred_language: userData?.preferredLanguage || 'ru',
        is_verified: true, // Помечаем как верифицированного после SMS
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (createError) {
        console.error('[SupabaseAuth] ❌ Ошибка создания пользователя:', createError);
        return { user: null, error: createError.message };
      }

      console.log('[SupabaseAuth] ✅ Новый пользователь создан:', newUser.id);
      return { user: newUser };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка получения/создания пользователя:', error);
      return { user: null, error: `Ошибка работы с пользователем: ${error}` };
    }
  }

  /**
   * Создание Supabase Auth сессии для пользователя
   */
  private async createSupabaseAuthSession(user: SupabaseAuthUser): Promise<{ session: SupabaseAuthSession | null; error?: string }> {
    try {
      if (!supabase) {
        return { session: null, error: 'Supabase клиент не доступен' };
      }

      // Создаем email из номера телефона для Supabase Auth
      const email = `osonish.${user.phone.replace(/[^0-9]/g, '')}@osonish.app`;
      const password = `osonish_${user.id}_${Date.now()}`;

      console.log('[SupabaseAuth] 🔐 Создание Auth сессии для:', email);

      // Пытаемся войти с существующими учетными данными
      let authResult = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Если пользователя нет в Auth, создаем его
      if (authResult.error && authResult.error.message.includes('Invalid login credentials')) {
        console.log('[SupabaseAuth] 👤 Создание Auth пользователя...');

        authResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone: user.phone,
              user_id: user.id
            }
          }
        });
      }

      if (authResult.error) {
        console.error('[SupabaseAuth] ❌ Ошибка Auth:', authResult.error.message);
        return { session: null, error: authResult.error.message };
      }

      if (!authResult.data.session) {
        return { session: null, error: 'Не удалось создать сессию' };
      }

      const session: SupabaseAuthSession = {
        access_token: authResult.data.session.access_token,
        refresh_token: authResult.data.session.refresh_token,
        expires_at: authResult.data.session.expires_at || 0,
        user: user
      };

      // Сохраняем сессию в AsyncStorage
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

      console.log('[SupabaseAuth] ✅ Auth сессия создана успешно');
      return { session };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка создания Auth сессии:', error);
      return { session: null, error: `Ошибка создания сессии: ${error}` };
    }
  }

  /**
   * Отправка SMS кода для авторизации по номеру телефона
   */
  async signInWithPhone(request: PhoneAuthRequest): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SupabaseAuth] 📱 Отправка SMS кода на номер:', request.phone);

      const formattedPhone = this.formatPhoneNumber(request.phone);
      const smsService = this.getSMSService();

      // Отправляем SMS код
      const smsResult = await smsService.sendVerificationCode(formattedPhone, smsConfig.senderName);

      if (!smsResult.success) {
        console.error('[SupabaseAuth] ❌ Ошибка отправки SMS:', smsResult.error);
        return { success: false, error: smsResult.error };
      }

      console.log('[SupabaseAuth] ✅ SMS код отправлен успешно');
      return { success: true };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка отправки SMS кода:', error);
      return { success: false, error: `Ошибка отправки SMS: ${error}` };
    }
  }

  /**
   * Верификация SMS кода и создание сессии
   */
  async verifyOtp(request: PhoneVerifyRequest): Promise<AuthResponse> {
    try {
      console.log('[SupabaseAuth] 🔐 Верификация SMS кода для номера:', request.phone);

      const formattedPhone = this.formatPhoneNumber(request.phone);
      const smsService = this.getSMSService();

      // Проверяем SMS код
      const verificationResult = await smsService.verifyCode(formattedPhone, request.token);

      if (!verificationResult.success) {
        console.error('[SupabaseAuth] ❌ Неверный SMS код:', verificationResult.error);
        return { success: false, error: verificationResult.error };
      }

      // Получаем или создаем пользователя
      const userResult = await this.getOrCreateUserByPhone(formattedPhone, request.options?.data);

      if (!userResult.user) {
        console.error('[SupabaseAuth] ❌ Ошибка получения пользователя:', userResult.error);
        return { success: false, error: userResult.error };
      }

      // Создаем Supabase Auth сессию
      const sessionResult = await this.createSupabaseAuthSession(userResult.user);

      if (!sessionResult.session) {
        console.error('[SupabaseAuth] ❌ Ошибка создания сессии:', sessionResult.error);
        return { success: false, error: sessionResult.error };
      }

      console.log('[SupabaseAuth] 🎉 Авторизация успешна для пользователя:', userResult.user.id);

      return {
        success: true,
        user: userResult.user,
        session: sessionResult.session
      };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка верификации:', error);
      return { success: false, error: `Ошибка верификации: ${error}` };
    }
  }

  /**
   * Получение текущей сессии
   */
  async getSession(): Promise<{ session: SupabaseAuthSession | null; error?: string }> {
    try {
      // Сначала проверяем сохраненную сессию
      const storedSession = await AsyncStorage.getItem(this.STORAGE_KEY);

      if (storedSession) {
        const session: SupabaseAuthSession = JSON.parse(storedSession);

        // Проверяем, не истекла ли сессия
        if (session.expires_at > Date.now() / 1000) {
          return { session };
        } else {
          console.log('[SupabaseAuth] ⏰ Сессия истекла, удаляем...');
          await AsyncStorage.removeItem(this.STORAGE_KEY);
        }
      }

      // Проверяем активную сессию в Supabase
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[SupabaseAuth] ❌ Ошибка получения сессии:', error.message);
          return { session: null, error: error.message };
        }

        if (session) {
          // Получаем данные пользователя из нашей таблицы
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('phone', session.user.phone || session.user.user_metadata?.phone)
            .single();

          if (userData) {
            const customSession: SupabaseAuthSession = {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || 0,
              user: userData
            };

            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(customSession));
            return { session: customSession };
          }
        }
      }

      return { session: null };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка получения сессии:', error);
      return { session: null, error: `Ошибка получения сессии: ${error}` };
    }
  }

  /**
   * Выход из системы
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[SupabaseAuth] 👋 Выход из системы...');

      // Удаляем сохраненную сессию
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      // Выходим из Supabase Auth
      if (supabase) {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error('[SupabaseAuth] ❌ Ошибка выхода из Supabase:', error.message);
          return { success: false, error: error.message };
        }
      }

      console.log('[SupabaseAuth] ✅ Выход выполнен успешно');
      return { success: true };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка выхода:', error);
      return { success: false, error: `Ошибка выхода: ${error}` };
    }
  }

  /**
   * Обновление данных пользователя
   */
  async updateUser(userId: string, updates: Partial<SupabaseAuthUser>): Promise<{ success: boolean; user?: SupabaseAuthUser; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase клиент не доступен' };
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseAuth] ❌ Ошибка обновления пользователя:', error);
        return { success: false, error: error.message };
      }

      console.log('[SupabaseAuth] ✅ Пользователь обновлен:', userId);
      return { success: true, user: updatedUser };

    } catch (error) {
      console.error('[SupabaseAuth] ❌ Ошибка обновления пользователя:', error);
      return { success: false, error: `Ошибка обновления: ${error}` };
    }
  }
}

// Экспортируем синглтон
export const supabaseAuthService = new SupabaseAuthService();
