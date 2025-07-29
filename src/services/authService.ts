import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginRequest, VerifyCodeRequest, RegisterRequest, AuthResponse } from '../types';
import { smsService } from './smsService';
import { supabase } from './supabaseClient';

// Константы для хранения данных
const STORAGE_KEYS = {
  AUTH_STATE: '@osonish_auth_state',
  USERS: '@osonish_users',
  CURRENT_USER_ID: '@osonish_current_user_id'
};

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null
  };

  private users: Map<string, User> = new Map();

  // Инициализация сервиса
  async init(): Promise<void> {
    try {
      // Загружаем состояние авторизации
      const storedAuthState = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (storedAuthState) {
        this.authState = JSON.parse(storedAuthState);
      }

      // Загружаем пользователей
      const storedUsers = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      if (storedUsers) {
        const usersArray: User[] = JSON.parse(storedUsers);
        this.users = new Map(usersArray.map(user => [user.phone, user]));
      }

      // Проверяем текущего пользователя
      const currentUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (currentUserId && this.users.has(currentUserId)) {
        this.authState = {
          isAuthenticated: true,
          user: this.users.get(currentUserId) || null
        };
      }

      // Синхронизируем существующих пользователей с Supabase
      await this.syncUsersToSupabase();
    } catch (error) {
      console.error('Ошибка инициализации AuthService:', error);
    }
  }

  /**
   * Синхронизация локальных пользователей с Supabase
   */
  private async syncUsersToSupabase(): Promise<void> {
    try {
      if (!supabase || this.users.size === 0) {
        return;
      }

      console.log('[AuthService] Синхронизируем существующих пользователей с Supabase...');

      for (const [phone, user] of this.users) {
        // Проверяем, существует ли пользователь в Supabase
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Создаем пользователя в Supabase если его там нет
          await this.createUserInSupabase(user);
        }
      }

      console.log('[AuthService] ✅ Синхронизация пользователей завершена');
    } catch (error) {
      console.error('[AuthService] Ошибка синхронизации пользователей:', error);
    }
  }

  // Сохранение состояния
  private async saveAuthState(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(this.authState));

      if (this.authState.user) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.authState.user.phone);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (error) {
      console.error('Ошибка сохранения состояния авторизации:', error);
    }
  }

  // Сохранение пользователей
  private async saveUsers(): Promise<void> {
    try {
      const usersArray = Array.from(this.users.values());
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersArray));
    } catch (error) {
      console.error('Ошибка сохранения пользователей:', error);
    }
  }

  // Генерация ID для пользователя
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Форматирование номера телефона
  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      return '+' + digits;
    }
    if (digits.startsWith('8') && digits.length === 10) {
      return '+998' + digits.slice(1);
    }
    return phone;
  }

  // Получение текущего состояния авторизации
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Проверка, существует ли пользователь
  getUserByPhone(phone: string): User | null {
    const formattedPhone = this.formatPhoneNumber(phone);
    return this.users.get(formattedPhone) || null;
  }

  // Начало процесса авторизации (отправка SMS)
  async sendLoginCode(request: LoginRequest): Promise<AuthResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Отправляем SMS код
      const smsResult = await smsService.sendVerificationCode(formattedPhone);

      if (smsResult.success) {
        return { success: true };
      } else {
        return { success: false, error: smsResult.error || 'Не удалось отправить SMS' };
      }
    } catch (error) {
      console.error('Ошибка отправки кода входа:', error);
      return { success: false, error: 'Произошла ошибка при отправке кода' };
    }
  }

  // Верификация кода для входа
  async verifyLoginCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Проверяем код
      const verificationResult = await smsService.verifyCode(formattedPhone, request.code);

      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error };
      }

      // Ищем пользователя
      const user = this.getUserByPhone(formattedPhone);

      if (user) {
        // Пользователь существует - авторизуем
        this.authState = {
          isAuthenticated: true,
          user: user
        };

        await this.saveAuthState();

        return {
          success: true,
          user: user
        };
      } else {
        // Пользователь не найден - нужна регистрация
        return {
          success: false,
          error: 'user_not_found'
        };
      }
    } catch (error) {
      console.error('Ошибка верификации кода входа:', error);
      return { success: false, error: 'Произошла ошибка при проверке кода' };
    }
  }

  // Начало процесса регистрации (отправка SMS)
  async sendRegistrationCode(phone: string): Promise<AuthResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Проверяем, не существует ли уже пользователь
      if (this.getUserByPhone(formattedPhone)) {
        return { success: false, error: 'Пользователь с таким номером уже существует' };
      }

      // Отправляем SMS код
      const smsResult = await smsService.sendVerificationCode(formattedPhone);

      if (smsResult.success) {
        return { success: true };
      } else {
        return { success: false, error: smsResult.error || 'Не удалось отправить SMS' };
      }
    } catch (error) {
      console.error('Ошибка отправки кода регистрации:', error);
      return { success: false, error: 'Произошла ошибка при отправке кода' };
    }
  }

  // Верификация кода для регистрации
  async verifyRegistrationCode(request: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Проверяем код
      const verificationResult = await smsService.verifyCode(formattedPhone, request.code);

      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error };
      }

      // Проверяем, не создан ли уже пользователь
      if (this.getUserByPhone(formattedPhone)) {
        return { success: false, error: 'Пользователь с таким номером уже существует' };
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка верификации кода регистрации:', error);
      return { success: false, error: 'Произошла ошибка при проверке кода' };
    }
  }

  // Завершение регистрации
  async completeRegistration(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(request.phone);

      // Проверяем, не существует ли уже пользователь
      if (this.getUserByPhone(formattedPhone)) {
        return { success: false, error: 'Пользователь с таким номером уже существует' };
      }

      // Создаем нового пользователя
      const newUser: User = {
        id: this.generateUserId(),
        phone: formattedPhone,
        firstName: request.firstName,
        lastName: request.lastName,
        middleName: request.middleName,
        birthDate: request.birthDate,
        profileImage: request.profileImage,
        role: request.role,
        isVerified: true, // После прохождения SMS верификации
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Сохраняем пользователя локально
      this.users.set(formattedPhone, newUser);
      await this.saveUsers();

      // Сохраняем пользователя в Supabase (если доступен)
      await this.createUserInSupabase(newUser);

      // Авторизуем пользователя
      this.authState = {
        isAuthenticated: true,
        user: newUser
      };

      await this.saveAuthState();

      return {
        success: true,
        user: newUser
      };
    } catch (error) {
      console.error('Ошибка завершения регистрации:', error);
      return { success: false, error: 'Произошла ошибка при регистрации' };
    }
  }

  /**
   * Создание пользователя в Supabase
   */
  private async createUserInSupabase(user: User): Promise<void> {
    try {
      if (!supabase) {
        console.log('[AuthService] Supabase недоступен, пользователь сохранен только локально');
        return;
      }

      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          phone: user.phone,
          first_name: user.firstName,
          last_name: user.lastName,
          middle_name: user.middleName,
          birth_date: user.birthDate,
          role: user.role,
          profile_image: user.profileImage,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        });

      if (error) {
        console.error('[AuthService] Ошибка создания пользователя в Supabase:', error);
      } else {
        console.log('[AuthService] ✅ Пользователь создан в Supabase:', user.firstName, user.lastName);
      }
    } catch (error) {
      console.error('[AuthService] Исключение при создании пользователя в Supabase:', error);
    }
  }

  // Выход из системы
  async logout(): Promise<void> {
    try {
      this.authState = {
        isAuthenticated: false,
        user: null
      };

      await this.saveAuthState();
    } catch (error) {
      console.error('Ошибка выхода из системы:', error);
    }
  }

  // Обновление профиля пользователя
  async updateProfile(updates: Partial<Omit<User, 'id' | 'phone' | 'createdAt'>>): Promise<AuthResponse> {
    try {
      if (!this.authState.user) {
        return { success: false, error: 'Пользователь не авторизован' };
      }

      const updatedUser: User = {
        ...this.authState.user,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Обновляем пользователя в хранилище
      this.users.set(updatedUser.phone, updatedUser);
      await this.saveUsers();

      // Обновляем текущее состояние
      this.authState.user = updatedUser;
      await this.saveAuthState();

      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      return { success: false, error: 'Произошла ошибка при обновлении профиля' };
    }
  }

  // Получение всех пользователей (для тестирования)
  getAllUsers(): User[] {
    return Array.from(this.users.values());
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

      // Очищаем локальные данные
      this.users.clear();
      this.authState = {
        isAuthenticated: false,
        user: null
      };

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_STATE,
        STORAGE_KEYS.USERS,
        STORAGE_KEYS.CURRENT_USER_ID
      ]);

      console.log('[AuthService] ✅ Локальные данные пользователей очищены');
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
    }
  }
}

// Экспортируем синглтон
export const authService = new AuthService(); 