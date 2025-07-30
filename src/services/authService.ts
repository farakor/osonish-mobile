import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginRequest, VerifyCodeRequest, RegisterRequest, AuthResponse } from '../types';
import { smsService } from './smsService';
import { supabase } from './supabaseClient';

// Константы для хранения только сессионных данных
const STORAGE_KEYS = {
  SESSION_TOKEN: '@osonish_session_token',
  CURRENT_USER_ID: '@osonish_current_user_id'
};

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null
  };

  // Инициализация сервиса
  async init(): Promise<void> {
    try {
      if (!supabase) {
        console.error('[AuthService] Supabase не инициализирован');
        return;
      }

      // Проверяем сохраненную сессию
      const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

      if (storedUserId && storedToken) {
        // Проверяем валидность сессии через загрузку пользователя из Supabase
        const user = await this.loadUserFromSupabase(storedUserId);
        if (user) {
          this.authState = {
            isAuthenticated: true,
            user
          };
          console.log(`[AuthService] Сессия восстановлена для пользователя: ${user.firstName} ${user.lastName}`);
        } else {
          // Сессия невалидна, очищаем
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Ошибка инициализации AuthService:', error);
      await this.clearSession();
    }
  }

  // Загрузка пользователя из Supabase
  private async loadUserFromSupabase(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.log(`[AuthService] Пользователь с ID ${userId} не найден в Supabase`);
        return null;
      }

      return {
        id: data.id,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        birthDate: data.birth_date,
        profileImage: data.profile_image,
        role: data.role as 'customer' | 'worker',
        isVerified: data.is_verified || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error(`[AuthService] Ошибка загрузки пользователя ${userId}:`, error);
      return null;
    }
  }

  // Сохранение сессии (только токен и ID пользователя)
  private async saveSession(user: User): Promise<void> {
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

      console.log('[AuthService] Сессия сохранена');
    } catch (error) {
      console.error('Ошибка сохранения сессии:', error);
    }
  }

  // Очистка сессии
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION_TOKEN,
        STORAGE_KEYS.CURRENT_USER_ID
      ]);

      this.authState = {
        isAuthenticated: false,
        user: null
      };

      console.log('[AuthService] Сессия очищена');
    } catch (error) {
      console.error('Ошибка очистки сессии:', error);
    }
  }

  // Форматирование номера телефона
  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('998') && digits.length === 12) {
      return '+' + digits;
    } else if (digits.length === 9) {
      return '+998' + digits;
    } else if (digits.length === 12 && digits.startsWith('998')) {
      return '+998' + digits.slice(1);
    }
    return phone;
  }

  // Получение текущего состояния авторизации
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Проверка, существует ли пользователь по номеру телефона
  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      if (!supabase) {
        console.error('[AuthService] Supabase не доступен');
        return null;
      }

      const formattedPhone = this.formatPhoneNumber(phone);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', formattedPhone)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        birthDate: data.birth_date,
        profileImage: data.profile_image,
        role: data.role as 'customer' | 'worker',
        isVerified: data.is_verified || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Ошибка поиска пользователя по телефону:', error);
      return null;
    }
  }

  // Генерация ID для пользователя
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Аутентификация пользователя (вход)
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Попытка входа для номера:', credentials.phone);

      const formattedPhone = this.formatPhoneNumber(credentials.phone);
      const existingUser = await this.getUserByPhone(formattedPhone);

      if (!existingUser) {
        return {
          success: false,
          error: 'Пользователь не найден. Пожалуйста, зарегистрируйтесь.'
        };
      }

      // Отправляем SMS-код
      const smsResult = await smsService.sendVerificationCode(formattedPhone);
      if (!smsResult.success) {
        return {
          success: false,
          error: smsResult.error
        };
      }

      return {
        success: true,
        requiresVerification: true,
        phone: formattedPhone
      };
    } catch (error) {
      console.error('Ошибка входа:', error);
      return {
        success: false,
        error: 'Произошла ошибка при входе'
      };
    }
  }

  // Верификация SMS-кода для входа
  async verifyLoginCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Верификация кода для входа:', request.phone);

      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Проверяем SMS-код
      const verificationResult = await smsService.verifyCode(formattedPhone, request.code);
      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error
        };
      }

      // Загружаем пользователя из Supabase
      const user = await this.getUserByPhone(formattedPhone);
      if (!user) {
        return {
          success: false,
          error: 'Пользователь не найден'
        };
      }

      // Устанавливаем состояние авторизации
      this.authState = {
        isAuthenticated: true,
        user
      };

      // Сохраняем сессию
      await this.saveSession(user);

      console.log(`[AuthService] Пользователь ${user.firstName} ${user.lastName} успешно авторизован`);

      return {
        success: true,
        user,
        requiresVerification: false
      };
    } catch (error) {
      console.error('Ошибка верификации кода:', error);
      return {
        success: false,
        error: 'Произошла ошибка при верификации'
      };
    }
  }

  // Начало регистрации
  async startRegistration(phone: string): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Начало регистрации для номера:', phone);

      const formattedPhone = this.formatPhoneNumber(phone);

      // Проверяем, не зарегистрирован ли уже пользователь
      const existingUser = await this.getUserByPhone(formattedPhone);
      if (existingUser) {
        return {
          success: false,
          error: 'Пользователь с таким номером уже зарегистрирован'
        };
      }

      // Отправляем SMS-код
      const smsResult = await smsService.sendVerificationCode(formattedPhone);
      if (!smsResult.success) {
        return {
          success: false,
          error: smsResult.error
        };
      }

      return {
        success: true,
        requiresVerification: true,
        phone: formattedPhone
      };
    } catch (error) {
      console.error('Ошибка начала регистрации:', error);
      return {
        success: false,
        error: 'Произошла ошибка при регистрации'
      };
    }
  }

  // Верификация SMS-кода для регистрации
  async verifyRegistrationCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Верификация кода для регистрации:', request.phone);

      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Проверяем SMS-код
      const verificationResult = await smsService.verifyCode(formattedPhone, request.code);
      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error
        };
      }

      return {
        success: true,
        phone: formattedPhone,
        requiresProfileInfo: true
      };
    } catch (error) {
      console.error('Ошибка верификации кода регистрации:', error);
      return {
        success: false,
        error: 'Произошла ошибка при верификации'
      };
    }
  }

  // Завершение регистрации
  async completeRegistration(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Завершение регистрации для:', userData.phone);

      if (!supabase) {
        return {
          success: false,
          error: 'База данных недоступна'
        };
      }

      const formattedPhone = this.formatPhoneNumber(userData.phone);
      const userId = this.generateUserId();

      // Создаем пользователя в Supabase
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone: formattedPhone,
          first_name: userData.firstName,
          last_name: userData.lastName,
          middle_name: userData.middleName || null,
          birth_date: userData.birthDate,
          role: userData.role,
          profile_image: userData.profileImage || null,
          is_verified: true
        })
        .select()
        .single();

      if (error) {
        console.error('[AuthService] Ошибка создания пользователя в Supabase:', error);
        return {
          success: false,
          error: 'Не удалось создать пользователя'
        };
      }

      const newUser: User = {
        id: data.id,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        birthDate: data.birth_date,
        profileImage: data.profile_image,
        role: data.role as 'customer' | 'worker',
        isVerified: data.is_verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Устанавливаем состояние авторизации
      this.authState = {
        isAuthenticated: true,
        user: newUser
      };

      // Сохраняем сессию
      await this.saveSession(newUser);

      console.log(`[AuthService] Пользователь ${newUser.firstName} ${newUser.lastName} успешно зарегистрирован`);

      return {
        success: true,
        user: newUser
      };
    } catch (error) {
      console.error('Ошибка завершения регистрации:', error);
      return {
        success: false,
        error: 'Произошла ошибка при создании профиля'
      };
    }
  }

  // Обновление профиля пользователя
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      if (!this.authState.user || !supabase) {
        return {
          success: false,
          error: 'Пользователь не авторизован или база данных недоступна'
        };
      }

      const userId = this.authState.user.id;

      // Обновляем в Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          middle_name: updates.middleName,
          birth_date: updates.birthDate,
          profile_image: updates.profileImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[AuthService] Ошибка обновления профиля в Supabase:', error);
        return {
          success: false,
          error: 'Не удалось обновить профиль'
        };
      }

      // Обновляем локальное состояние
      const updatedUser: User = {
        id: data.id,
        phone: data.phone,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        birthDate: data.birth_date,
        profileImage: data.profile_image,
        role: data.role as 'customer' | 'worker',
        isVerified: data.is_verified,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      this.authState = {
        isAuthenticated: true,
        user: updatedUser
      };

      console.log(`[AuthService] Профиль пользователя ${updatedUser.firstName} ${updatedUser.lastName} обновлен`);

      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      return {
        success: false,
        error: 'Произошла ошибка при обновлении профиля'
      };
    }
  }

  // Выход из аккаунта
  async logout(): Promise<void> {
    try {
      await this.clearSession();
      console.log('[AuthService] Пользователь вышел из аккаунта');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  }

  // Получение всех пользователей из Supabase (для отображения заказчиков)
  async getAllUsersFromSupabase(): Promise<User[]> {
    try {
      if (!supabase) {
        console.error('[AuthService] Supabase не доступен');
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AuthService] Ошибка загрузки пользователей из Supabase:', error);
        return [];
      }

      const users: User[] = data.map((item: any) => ({
        id: item.id,
        phone: item.phone,
        firstName: item.first_name,
        lastName: item.last_name,
        middleName: item.middle_name,
        birthDate: item.birth_date,
        profileImage: item.profile_image,
        role: item.role as 'customer' | 'worker',
        isVerified: item.is_verified || false,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      console.log(`[AuthService] Загружено ${users.length} пользователей из Supabase`);
      return users;
    } catch (error) {
      console.error('[AuthService] Исключение при загрузке пользователей:', error);
      return [];
    }
  }

  // Поиск пользователя по ID
  async findUserById(userId: string): Promise<User | null> {
    return await this.loadUserFromSupabase(userId);
  }

  // Очистка всех данных (для тестирования)
  async clearAllData(): Promise<void> {
    try {
      // Очищаем пользователей в Supabase
      if (supabase) {
        try {
          const { error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) {
            console.error('[AuthService] Ошибка очистки пользователей в Supabase:', error);
          } else {
            console.log('[AuthService] ✅ Пользователи очищены в Supabase');
          }
        } catch (error) {
          console.error('[AuthService] Исключение при очистке Supabase:', error);
        }
      }

      // Очищаем сессию
      await this.clearSession();

      console.log('[AuthService] ✅ Все данные очищены');
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
    }
  }

  // Метод для совместимости (возвращает пустой массив, так как пользователи теперь только в Supabase)
  getAllUsers(): User[] {
    console.warn('[AuthService] getAllUsers устарел. Используйте getAllUsersFromSupabase()');
    return [];
  }
}

// Экспортируем синглтон
export const authService = new AuthService(); 