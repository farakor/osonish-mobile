import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, getTranslatedSpecializationName } from '../../constants';
import type { CustomerStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';
import { HeaderWithBack } from '../../components/common';
import { ProfessionalMasterCard } from '../../components/cards';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';
import { authService } from '../../services/authService';
import { useCustomerTranslation } from '../../hooks/useTranslation';
import { MasterCardSkeleton } from '../../components/skeletons';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'ProfessionalMastersList'>;

export const ProfessionalMastersListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { specializationId } = route.params;
  const t = useCustomerTranslation();
  const { t: tCommon } = useTranslation();

  const [masters, setMasters] = useState<ProfessionalMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMasters = useCallback(async () => {
    try {
      setIsLoading(true);
      const authState = authService.getAuthState();
      const userCity = authState.user?.city;

      // Если специализация не указана (список "Все мастера"), не показываем дневных работников
      const data = await professionalMasterService.getMasters({
        specializationId,
        city: userCity,
        limit: 50,
        includeDailyWorkers: !!specializationId, // true если есть специализация, false если это список "Все"
      });

      setMasters(data);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    } finally {
      setIsLoading(false);
    }
  }, [specializationId]);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMasters();
    setRefreshing(false);
  }, [loadMasters]);

  const handleMasterPress = (master: ProfessionalMaster) => {
    // Для job_seeker сразу открываем экран резюме
    if (master.workerType === 'job_seeker') {
      navigation.navigate('JobSeekerProfile', { masterId: master.id });
    } else {
      navigation.navigate('ProfessionalMasterProfile', { masterId: master.id });
    }
  };

  const renderMasterCard = ({ item }: { item: ProfessionalMaster }) => (
    <ProfessionalMasterCard
      master={item}
      onPress={() => handleMasterPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{t('masters_not_found')}</Text>
      <Text style={styles.emptyStateText}>
        {t('no_masters_in_city')}
      </Text>
    </View>
  );

  const title = specializationId
    ? getTranslatedSpecializationName(specializationId, tCommon)
    : t('professional_masters_title');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderWithBack title={title} backAction={() => navigation.goBack()} />

      {isLoading && masters.length === 0 ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={() => <MasterCardSkeleton />}
          keyExtractor={(item) => `skeleton-${item}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={masters}
          renderItem={renderMasterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          // Оптимизация производительности - виртуализация
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          // Оптимизация высоты элементов
          getItemLayout={(data, index) => ({
            length: 200, // Примерная высота карточки мастера
            offset: 200 * index,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

