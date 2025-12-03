import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
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

const PAGE_SIZE = 20;

export const ProfessionalMastersListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { specializationId } = route.params;
  const t = useCustomerTranslation();
  const { t: tCommon } = useTranslation();

  const [masters, setMasters] = useState<ProfessionalMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Используем ref для отслеживания текущего offset, чтобы избежать race conditions
  const offsetRef = useRef(0);
  const isLoadingRef = useRef(false);

  const loadMasters = useCallback(async (reset: boolean = false) => {
    // Предотвращаем параллельные загрузки
    if (isLoadingRef.current && !reset) return;
    
    try {
      isLoadingRef.current = true;
      
      if (reset) {
        setIsLoading(true);
        offsetRef.current = 0;
      } else {
        setIsLoadingMore(true);
      }

      const authState = authService.getAuthState();
      const userCity = authState.user?.city;

      const result = await professionalMasterService.getMastersWithPagination({
        specializationId,
        city: userCity,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
        includeDailyWorkers: !!specializationId,
        includeJobSeekers: true,
      });

      if (reset) {
        setMasters(result.masters);
      } else {
        setMasters(prev => [...prev, ...result.masters]);
      }
      
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      offsetRef.current += result.masters.length;

      console.log(`[MastersList] Загружено: ${result.masters.length}, Всего в списке: ${reset ? result.masters.length : masters.length + result.masters.length}, Всего в БД: ${result.totalCount}, Есть ещё: ${result.hasMore}`);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [specializationId, masters.length]);

  useEffect(() => {
    loadMasters(true);
  }, [specializationId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMasters(true);
    setRefreshing(false);
  }, [loadMasters]);

  const onEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      loadMasters(false);
    }
  }, [isLoadingMore, hasMore, isLoading, loadMasters]);

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

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerLoaderText}>Загрузка...</Text>
      </View>
    );
  };

  const renderListHeader = () => {
    if (totalCount === 0 || isLoading) return null;
    
    return (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          Найдено: {totalCount} {getSpecialistWord(totalCount)}
        </Text>
      </View>
    );
  };

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
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          // Бесконечная прокрутка
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          // Оптимизация производительности
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          // Оптимизация высоты элементов
          getItemLayout={(data, index) => ({
            length: 200,
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

// Вспомогательная функция для склонения слова "специалист"
const getSpecialistWord = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'специалистов';
  }

  if (lastDigit === 1) {
    return 'специалист';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'специалиста';
  }

  return 'специалистов';
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
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  listHeaderText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  footerLoaderText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
});

