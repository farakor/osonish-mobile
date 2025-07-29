import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CreateOrderRequest, CreateOrderResponse, OrdersState } from '../types';
import { authService } from './authService';

// Используем общий ключ для всех заказов в системе
const GLOBAL_ORDERS_STORAGE_KEY = '@osonish_global:orders';

export class OrderService {
  private static instance: OrderService;

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Создание нового заказа
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // Получаем текущего пользователя
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'Пользователь не авторизован',
        };
      }

      // Генерируем новый заказ
      const newOrder: Order = {
        id: this.generateOrderId(),
        ...orderData,
        customerId: authState.user.id,
        status: 'active',
        applicantsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Получаем все существующие заказы (глобальные)
      const existingOrders = await this.getAllOrders();

      // Добавляем новый заказ
      const updatedOrders = [newOrder, ...existingOrders];

      // Сохраняем в глобальное хранилище
      await this.saveGlobalOrders(updatedOrders);

      console.log(`[OrderService] Создан заказ ${newOrder.id} пользователем ${authState.user.firstName} ${authState.user.lastName}`);

      return {
        success: true,
        data: newOrder,
      };
    } catch (error) {
      console.error('Ошибка создания заказа:', error);
      return {
        success: false,
        error: 'Не удалось создать заказ',
      };
    }
  }

  /**
   * Получение всех активных заказов (для исполнителей)
   */
  async getAvailableOrders(): Promise<Order[]> {
    try {
      const allOrders = await this.getAllOrders();
      console.log(`[OrderService] Всего заказов в хранилище: ${allOrders.length}`);

      if (allOrders.length > 0) {
        console.log('[OrderService] Первый заказ:', allOrders[0]);
        console.log('[OrderService] Статусы заказов:', allOrders.map(o => `${o.id}: ${o.status}`));
      }

      // Возвращаем только активные заказы
      const activeOrders = allOrders.filter(order => order.status === 'active');
      console.log(`[OrderService] Активных заказов: ${activeOrders.length}`);

      return activeOrders;
    } catch (error) {
      console.error('Ошибка получения доступных заказов:', error);
      return [];
    }
  }

  /**
   * Получение заказов конкретного пользователя (для заказчиков)
   */
  async getUserOrders(userId?: string): Promise<Order[]> {
    try {
      // Если userId не указан, берем текущего пользователя
      if (!userId) {
        const authState = authService.getAuthState();
        if (!authState.isAuthenticated || !authState.user) {
          return [];
        }
        userId = authState.user.id;
      }

      const allOrders = await this.getAllOrders();
      return allOrders.filter(order => order.customerId === userId);
    } catch (error) {
      console.error('Ошибка получения заказов пользователя:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов пользователя
   */
  async getUserActiveOrders(userId?: string): Promise<Order[]> {
    try {
      const userOrders = await this.getUserOrders(userId);
      return userOrders.filter(order => order.status === 'active');
    } catch (error) {
      console.error('Ошибка получения активных заказов:', error);
      return [];
    }
  }

  /**
   * Получение заказа по ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orders = await this.getAllOrders();
      return orders.find(order => order.id === orderId) || null;
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      return null;
    }
  }

  /**
   * Обновление статуса заказа
   */
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      const orders = await this.getAllOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);

      if (orderIndex === -1) {
        return false;
      }

      orders[orderIndex] = {
        ...orders[orderIndex],
        status,
        updatedAt: new Date().toISOString(),
      };

      await this.saveGlobalOrders(orders);
      return true;
    } catch (error) {
      console.error('Ошибка обновления заказа:', error);
      return false;
    }
  }

  /**
   * Увеличение счетчика откликов на заказ
   */
  async incrementOrderApplicants(orderId: string): Promise<boolean> {
    try {
      const orders = await this.getAllOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);

      if (orderIndex === -1) {
        return false;
      }

      orders[orderIndex] = {
        ...orders[orderIndex],
        applicantsCount: orders[orderIndex].applicantsCount + 1,
        updatedAt: new Date().toISOString(),
      };

      await this.saveGlobalOrders(orders);
      return true;
    } catch (error) {
      console.error('Ошибка обновления счетчика откликов:', error);
      return false;
    }
  }

  /**
   * Удаление заказа (только для автора заказа)
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }

      const orders = await this.getAllOrders();
      const order = orders.find(o => o.id === orderId);

      // Проверяем, что пользователь является автором заказа
      if (!order || order.customerId !== authState.user.id) {
        return false;
      }

      const filteredOrders = orders.filter(order => order.id !== orderId);
      await this.saveGlobalOrders(filteredOrders);
      return true;
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      return false;
    }
  }

  /**
   * Получение статистики по заказам
   */
  async getOrdersStats() {
    try {
      const allOrders = await this.getAllOrders();
      const authState = authService.getAuthState();

      if (!authState.isAuthenticated || !authState.user) {
        return {
          total: 0,
          active: 0,
          completed: 0,
          userOrders: 0
        };
      }

      const userOrders = allOrders.filter(order => order.customerId === authState.user!.id);

      return {
        total: allOrders.length,
        active: allOrders.filter(order => order.status === 'active').length,
        completed: allOrders.filter(order => order.status === 'completed').length,
        userOrders: userOrders.length
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return {
        total: 0,
        active: 0,
        completed: 0,
        userOrders: 0
      };
    }
  }

  // Приватные методы

  /**
   * Получение всех заказов из глобального хранилища
   */
  private async getAllOrders(): Promise<Order[]> {
    try {
      console.log(`[OrderService] Читаем заказы из ключа: ${GLOBAL_ORDERS_STORAGE_KEY}`);
      const ordersData = await AsyncStorage.getItem(GLOBAL_ORDERS_STORAGE_KEY);

      if (!ordersData) {
        console.log('[OrderService] Данные заказов не найдены в хранилище');
        return [];
      }

      console.log('[OrderService] Сырые данные из хранилища:', ordersData.substring(0, 200) + '...');
      const parsedData: OrdersState = JSON.parse(ordersData);
      console.log(`[OrderService] Распарсено заказов: ${parsedData.orders.length}`);

      return parsedData.orders;
    } catch (error) {
      console.error('Ошибка чтения заказов из хранилища:', error);
      return [];
    }
  }

  /**
   * Сохранение заказов в глобальное хранилище
   */
  private async saveGlobalOrders(orders: Order[]): Promise<void> {
    const ordersState: OrdersState = {
      orders,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[OrderService] Сохраняем ${orders.length} заказов в ключ: ${GLOBAL_ORDERS_STORAGE_KEY}`);
    await AsyncStorage.setItem(GLOBAL_ORDERS_STORAGE_KEY, JSON.stringify(ordersState));
    console.log('[OrderService] Заказы успешно сохранены');
  }

  /**
   * Генерация уникального ID для заказа
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Очистка всех заказов (для тестирования)
   */
  async clearAllOrders(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GLOBAL_ORDERS_STORAGE_KEY);
      console.log('[OrderService] Все заказы очищены');
    } catch (error) {
      console.error('Ошибка очистки заказов:', error);
    }
  }
}

// Создаем экземпляр сервиса для экспорта
export const orderService = OrderService.getInstance(); 