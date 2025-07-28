import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CreateOrderRequest, CreateOrderResponse, OrdersState } from '../types';

const ORDERS_STORAGE_KEY = '@osonish:orders';
const CURRENT_USER_ID = 'user_123'; // TODO: заменить на реальный ID пользователя из контекста

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
      // Генерируем новый заказ
      const newOrder: Order = {
        id: this.generateOrderId(),
        ...orderData,
        customerId: CURRENT_USER_ID,
        status: 'active',
        applicantsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Получаем существующие заказы
      const existingOrders = await this.getOrders();

      // Добавляем новый заказ
      const updatedOrders = [newOrder, ...existingOrders];

      // Сохраняем в локальное хранилище
      await this.saveOrders(updatedOrders);

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
   * Получение всех заказов пользователя
   */
  async getUserOrders(userId: string = CURRENT_USER_ID): Promise<Order[]> {
    try {
      const allOrders = await this.getOrders();
      return allOrders.filter(order => order.customerId === userId);
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
      return [];
    }
  }

  /**
   * Получение активных заказов пользователя
   */
  async getUserActiveOrders(userId: string = CURRENT_USER_ID): Promise<Order[]> {
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
      const orders = await this.getOrders();
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
      const orders = await this.getOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);

      if (orderIndex === -1) {
        return false;
      }

      orders[orderIndex] = {
        ...orders[orderIndex],
        status,
        updatedAt: new Date().toISOString(),
      };

      await this.saveOrders(orders);
      return true;
    } catch (error) {
      console.error('Ошибка обновления заказа:', error);
      return false;
    }
  }

  /**
   * Удаление заказа
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const orders = await this.getOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      await this.saveOrders(filteredOrders);
      return true;
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      return false;
    }
  }

  // Приватные методы

  /**
   * Получение всех заказов из хранилища
   */
  private async getOrders(): Promise<Order[]> {
    try {
      const ordersData = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (!ordersData) {
        return [];
      }

      const parsedData: OrdersState = JSON.parse(ordersData);
      return parsedData.orders;
    } catch (error) {
      console.error('Ошибка чтения заказов из хранилища:', error);
      return [];
    }
  }

  /**
   * Сохранение заказов в хранилище
   */
  private async saveOrders(orders: Order[]): Promise<void> {
    const ordersState: OrdersState = {
      orders,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(ordersState));
  }

  /**
   * Генерация уникального ID для заказа
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Создаем экземпляр сервиса для экспорта
export const orderService = OrderService.getInstance(); 