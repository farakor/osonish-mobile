import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginRequest, VerifyCodeRequest, RegisterRequest, AuthResponse } from '../types';
import { smsService } from './smsService';
import { supabase } from './supabaseClient';
import { mediaService } from './mediaService';

// Константы для хранения только сессионных данных
const STORAGE_KEYS = {
  SESSION_TOKEN: '@osonish_session_token',
  CURRENT_USER_ID: '@osonish_current_user_id',
  SUPABASE_SESSION: '@osonish_supabase_session' // Новый ключ для Supabase сессии
};

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null
  };

  // Инициализация сервиса
  async init(): Promise<void> {
    console.log('[AuthService] 🚀 Инициализация AuthService...');

    try {
      if (!supabase) {
        console.error('[AuthService] ❌ Supabase не инициализирован');
        return;
      }
      console.log('[AuthService] ✅ Supabase клиент доступен');

      // Проверяем сохраненную сессию
      console.log('[AuthService] 🔍 Проверяем сохраненные данные в AsyncStorage...');
      const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      const storedSupabaseSession = await AsyncStorage.getItem(STORAGE_KEYS.SUPABASE_SESSION);

      console.log('[AuthService] 📱 Найденные данные:', {
        hasUserId: !!storedUserId,
        hasToken: !!storedToken,
        hasSupabaseSession: !!storedSupabaseSession
      });

      // Восстанавливаем Supabase сессию если есть
      if (storedSupabaseSession) {
        console.log('[AuthService] 🔄 Восстанавливаем Supabase сессию...');
        try {
          const session = JSON.parse(storedSupabaseSession);
          console.log('[AuthService] 📋 Данные сессии:', {
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
            expiresAt: session.expires_at,
            userId: session.user?.id
          });

          const { data, error } = await supabase.auth.setSession(session);

          if (error) {
            console.error('[AuthService] ❌ Ошибка восстановления Supabase сессии:', error.message);
            await AsyncStorage.removeItem(STORAGE_KEYS.SUPABASE_SESSION);
            console.log('[AuthService] 🗑️ Поврежденная сессия удалена');
          } else {
            console.log('[AuthService] ✅ Supabase сессия успешно восстановлена');
            if (data.user) {
              console.log('[AuthService] 👤 Supabase пользователь:', data.user.id);
            }
          }
        } catch (error) {
          console.error('[AuthService] ❌ Ошибка парсинга Supabase сессии:', error);
          await AsyncStorage.removeItem(STORAGE_KEYS.SUPABASE_SESSION);
          console.log('[AuthService] 🗑️ Поврежденная сессия удалена');
        }
      } else {
        console.log('[AuthService] 💡 Сохраненная Supabase сессия не найдена');
      }

      if (storedUserId && storedToken) {
        console.log('[AuthService] 🔄 Восстанавливаем пользовательскую сессию...');
        console.log('[AuthService] 🆔 Пользователь ID:', storedUserId);

        // Проверяем валидность сессии через загрузку пользователя из Supabase
        const user = await this.loadUserFromSupabase(storedUserId);
        if (user) {
          this.authState = {
            isAuthenticated: true,
            user
          };
          console.log(`[AuthService] ✅ Сессия восстановлена для пользователя: ${user.firstName} ${user.lastName}`);
        } else {
          console.warn('[AuthService] ❌ Пользователь не найден в Supabase, очищаем сессию');
          // Сессия невалидна, очищаем
          await this.clearSession();
        }
      } else {
        console.log('[AuthService] 💡 Пользовательская сессия не найдена');
      }

      console.log('[AuthService] 🏁 Инициализация завершена');
    } catch (error) {
      console.error('[AuthService] ❌ Ошибка инициализации AuthService:', error);
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
        city: data.city,
        isVerified: data.is_verified || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error(`[AuthService] Ошибка загрузки пользователя ${userId}:`, error);
      return null;
    }
  }

  // Сохранение сессии (обновленный метод)
  private async saveSession(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, 'authenticated'); // Простой токен

      // Создаем аутентифицированную Supabase сессию для пользователя
      await this.createSupabaseAuthSession(user);

      console.log('[AuthService] ✅ Сессия сохранена');
    } catch (error) {
      console.error('[AuthService] ❌ Ошибка сохранения сессии:', error);
    }
  }

  // Очистка сессии (обновленный метод)
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION_TOKEN,
        STORAGE_KEYS.CURRENT_USER_ID,
        STORAGE_KEYS.SUPABASE_SESSION
      ]);

      // Выходим из Supabase Auth
      if (supabase) {
        await supabase.auth.signOut();
      }

      this.authState = {
        isAuthenticated: false,
        user: null
      };

      console.log('[AuthService] ✅ Сессия очищена');
    } catch (error) {
      console.error('[AuthService] ❌ Ошибка очистки сессии:', error);
    }
  }

  // Создание аутентифицированной сессии Supabase для загрузки файлов
  private async createSupabaseAuthSession(user: User): Promise<void> {
    console.log('[AuthService] 🚀 Создание Supabase Auth сессии для пользователя:', user.id);

    try {
      if (!supabase) {
        console.error('[AuthService] ❌ Supabase клиент не доступен');
        return;
      }

      // Создаем email из номера телефона для аутентификации
      const email = `osonish.${user.phone.replace(/[^0-9]/g, '')}@gmail.com`;
      const password = `osonish_${user.id}`;

      console.log('[AuthService] 📧 Используем email для Auth:', email);
      console.log('[AuthService] 🔐 Пароль сгенерирован для пользователя:', user.id);

      // Пробуем войти существующей учетной записью
      console.log('[AuthService] 🔄 Пытаемся войти с существующими учетными данными...');
      let authResult = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // Если пользователя нет, создаем его
      if (authResult.error?.message?.includes('Invalid login credentials')) {
        console.log('[AuthService] 🔄 Пользователь Auth не найден, создаем новую учетную запись...');

        authResult = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_id: user.id,
              phone: user.phone,
              first_name: user.firstName,
              last_name: user.lastName
            }
          }
        });

        if (authResult.data?.user) {
          console.log('[AuthService] ✅ Новая Auth учетная запись создана:', authResult.data.user.id);
        }

        // Если пользователь уже зарегистрирован, пропускаем создание Auth сессии
        if (authResult.error?.message?.includes('User already registered')) {
          console.log('[AuthService] 💡 Пользователь уже зарегистрирован в Supabase Auth, пропускаем создание сессии');
          console.log('[AuthService] 💡 Будем использовать анонимную загрузку для медиафайлов');
          return;
        }
      } else if (authResult.data?.user) {
        console.log('[AuthService] ✅ Вход выполнен с существующей Auth учетной записью:', authResult.data.user.id);
      }

      if (authResult.error) {
        // Если это не критическая ошибка, продолжаем с fallback
        if (!authResult.error.message?.includes('User already registered')) {
          console.error('[AuthService] ❌ Ошибка Supabase Auth:', authResult.error.message);
        } else {
          console.log('[AuthService] 💡 Попытка создания Auth сессии завершена');
        }
        console.log('[AuthService] 💡 Используем fallback к анонимной загрузке');
        return;
      }

      if (authResult.data.session) {
        // Сохраняем сессию для восстановления
        console.log('[AuthService] 💾 Сохраняем Supabase сессию в AsyncStorage...');
        console.log('[AuthService] 📋 Данные сессии:', {
          hasAccessToken: !!authResult.data.session.access_token,
          hasRefreshToken: !!authResult.data.session.refresh_token,
          expiresAt: authResult.data.session.expires_at,
          userId: authResult.data.session.user?.id
        });

        await AsyncStorage.setItem(STORAGE_KEYS.SUPABASE_SESSION, JSON.stringify(authResult.data.session));
        console.log('[AuthService] ✅ Supabase сессия сохранена в AsyncStorage');

        // Проверяем что сессия действительно сохранилась
        const savedSession = await AsyncStorage.getItem(STORAGE_KEYS.SUPABASE_SESSION);
        console.log('[AuthService] 🔍 Проверка сохранения:', savedSession ? 'сессия найдена в AsyncStorage' : 'сессия НЕ найдена в AsyncStorage');

        console.log('[AuthService] ✅ Создана аутентифицированная Supabase сессия для загрузки файлов');
      } else {
        console.warn('[AuthService] ⚠️ Не удалось получить сессию из Supabase Auth');
      }
    } catch (error) {
      console.error('[AuthService] ❌ Исключение при создании Auth сессии:', error);
      console.log('[AuthService] 💡 Используем fallback к анонимной загрузке');
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
        city: data.city,
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
          city: userData.city || null,
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
        city: data.city,
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

  // Загрузка аватара пользователя в Supabase Storage
  async uploadProfileImage(imageUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!this.authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      console.log('[AuthService] 🖼️ Загружаем аватар пользователя...');
      console.log('[AuthService] 📱 URI изображения:', imageUri);

      // Определяем размер файла
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileSize = blob.size;

      console.log(`[AuthService] 📏 Размер изображения: ${(fileSize / 1024).toFixed(1)} KB`);

      // Подготавливаем файл для загрузки
      const fileName = `profile_${this.authState.user.id}_${Date.now()}.jpg`;
      const file = {
        uri: imageUri,
        type: 'image' as const,
        name: fileName,
        size: fileSize
      };

      // Используем mediaService для загрузки
      const uploadResult = await mediaService.uploadMediaFiles([file]);

      if (!uploadResult.success || !uploadResult.urls || uploadResult.urls.length === 0) {
        console.error('[AuthService] ❌ Ошибка загрузки аватара:', uploadResult.error);
        return {
          success: false,
          error: uploadResult.error || 'Не удалось загрузить изображение'
        };
      }

      const profileImageUrl = uploadResult.urls[0];
      console.log('[AuthService] ✅ Аватар успешно загружен:', profileImageUrl);

      return {
        success: true,
        url: profileImageUrl
      };
    } catch (error) {
      console.error('[AuthService] ❌ Ошибка загрузки аватара:', error);
      return {
        success: false,
        error: 'Произошла ошибка при загрузке изображения'
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
      let profileImageUrl = updates.profileImage;

      // Если передано изображение и это локальный URI, загружаем его в Storage
      if (updates.profileImage && updates.profileImage.startsWith('file://')) {
        console.log('[AuthService] 🔄 Обнаружен локальный URI изображения, загружаем в Storage...');

        const uploadResult = await this.uploadProfileImage(updates.profileImage);
        if (!uploadResult.success) {
          return {
            success: false,
            error: uploadResult.error || 'Не удалось загрузить изображение профиля'
          };
        }

        profileImageUrl = uploadResult.url;
        console.log('[AuthService] ✅ Изображение загружено, URL:', profileImageUrl);
      }

      // Обновляем в Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          middle_name: updates.middleName,
          birth_date: updates.birthDate,
          profile_image: profileImageUrl,
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
        city: data.city,
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
        city: item.city,
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