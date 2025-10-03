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
import { theme, getSpecializationName } from '../../constants';
import type { CustomerStackParamList } from '../../types';
import { HeaderWithBack } from '../../components/common';
import { ProfessionalMasterCard } from '../../components/cards';
import {
  professionalMasterService,
  ProfessionalMaster,
} from '../../services/professionalMasterService';
import { authService } from '../../services/authService';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;
type ScreenRouteProp = RouteProp<CustomerStackParamList, 'ProfessionalMastersList'>;

export const ProfessionalMastersListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { specializationId } = route.params;

  const [masters, setMasters] = useState<ProfessionalMaster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMasters = useCallback(async () => {
    try {
      setIsLoading(true);
      const authState = authService.getAuthState();
      const userCity = authState.user?.city;

      const data = await professionalMasterService.getMasters({
        specializationId,
        city: userCity,
        limit: 50,
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

  const handleMasterPress = (masterId: string) => {
    navigation.navigate('ProfessionalMasterProfile', { masterId });
  };

  const renderMasterCard = ({ item }: { item: ProfessionalMaster }) => (
    <ProfessionalMasterCard
      master={item}
      onPress={() => handleMasterPress(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Мастера не найдены</Text>
      <Text style={styles.emptyStateText}>
        В этой категории пока нет мастеров в вашем городе
      </Text>
    </View>
  );

  const title = specializationId
    ? getSpecializationName(specializationId)
    : 'Профессиональные мастера';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HeaderWithBack title={title} backAction={() => navigation.goBack()} />

      {isLoading && masters.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={masters}
          renderItem={renderMasterCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
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

