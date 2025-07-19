import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../../constants/theme';
import { StatsWidget, StatItem } from '../../components/common';


export const WorkerProfileScreen: React.FC = () => {

  const statsData: StatItem[] = [
    {
      id: 'orders',
      icon: '✅',
      value: '23',
      label: 'Выполнено заказов',
      color: '#34C759',
    },
    {
      id: 'rating',
      icon: '⭐',
      value: '4.9',
      label: 'Рейтинг',
      color: '#FF9500',
    },
    {
      id: 'experience',
      icon: '🕐',
      value: '8 мес',
      label: 'На платформе',
      color: theme.colors.primary,
    },
  ];

  const handleEditProfile = () => {
    Alert.alert('Редактирование профиля', 'Функция будет добавлена в следующем обновлении');
  };



  const handleNavigation = (screen: string) => {
    Alert.alert(screen, 'Функция будет добавлена в следующем обновлении');
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход из аккаунта',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => console.log('Logout') }
      ]
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightIcon = '›',
    showBorder = true
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    rightIcon?: string;
    showBorder?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, !showBorder && styles.menuItemNoBorder]}
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.menuItemArrow}>{rightIcon}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screenContent}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>АР</Text>
            </View>
            <Text style={styles.profileName}>Алишер Рахимов</Text>
            <Text style={styles.profileRole}>Исполнитель</Text>
          </View>

          {/* Enhanced Stats Widget */}
          <StatsWidget
            stats={statsData}
            variant="cards"
            style={{ marginBottom: theme.spacing.lg }}
          />

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Быстрые действия</Text>
            <View style={styles.menuContainer}>
              <MenuItem
                icon="✏️"
                title="Редактировать профиль"
                subtitle="Фото, контакты, описание"
                onPress={handleEditProfile}
              />
              <MenuItem
                icon="⭐"
                title="Мои отзывы"
                subtitle="23 отзыва от заказчиков"
                onPress={() => handleNavigation('Отзывы')}
              />
              <MenuItem
                icon="📊"
                title="Статистика заработка"
                subtitle="Доходы за месяц"
                onPress={() => handleNavigation('Статистика')}
                showBorder={false}
              />
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Настройки</Text>
            <View style={styles.menuContainer}>
              <MenuItem
                icon="🔔"
                title="Уведомления"
                subtitle="Новые заказы, сообщения"
                onPress={() => handleNavigation('Уведомления')}
              />
              <MenuItem
                icon="💳"
                title="Способы получения оплаты"
                subtitle="Карты, кошельки"
                onPress={() => handleNavigation('Оплата')}
              />
              <MenuItem
                icon="📍"
                title="Радиус работы"
                subtitle="Где вы готовы работать"
                onPress={() => handleNavigation('Радиус работы')}
              />
              <MenuItem
                icon="🏷️"
                title="Мои тарифы"
                subtitle="Цены на услуги"
                onPress={() => handleNavigation('Тарифы')}
                showBorder={false}
              />
            </View>
          </View>

          {/* Support & Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Поддержка</Text>
            <View style={styles.menuContainer}>
              <MenuItem
                icon="❓"
                title="Помощь"
                subtitle="Часто задаваемые вопросы"
                onPress={() => handleNavigation('Помощь')}
              />
              <MenuItem
                icon="💬"
                title="Связаться с поддержкой"
                subtitle="Чат с операторами"
                onPress={() => handleNavigation('Поддержка')}
              />
              <MenuItem
                icon="📋"
                title="Условия использования"
                onPress={() => handleNavigation('Условия')}
              />
              <MenuItem
                icon="🔒"
                title="Политика конфиденциальности"
                onPress={() => handleNavigation('Конфиденциальность')}
                showBorder={false}
              />
            </View>
          </View>

          {/* App Info & Logout */}
          <View style={styles.section}>
            <View style={styles.menuContainer}>
              <MenuItem
                icon="📱"
                title="Версия приложения"
                onPress={() => { }}
                rightIcon="v1.0.0"
              />
              <MenuItem
                icon="🚪"
                title="Выйти из аккаунта"
                onPress={handleLogout}
                rightIcon=""
                showBorder={false}
              />
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContent: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemNoBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  menuItemArrow: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
}); 