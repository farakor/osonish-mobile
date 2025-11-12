import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants';
import { VacancyCard } from '../../components/vacancy';
import { useVacancies } from '../../hooks/queries/useVacancyQueries';
import { HeaderWithBack } from '../../components/common';
import { Order } from '../../types';

export const VacanciesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: vacancies, isLoading, refetch, isRefreshing } = useVacancies();
  const [searchQuery, setSearchQuery] = useState('');

  const handleVacancyPress = (vacancy: Order) => {
    navigation.navigate('VacancyDetails' as never, { vacancyId: vacancy.id } as never);
  };

  const filteredVacancies = vacancies?.filter((vacancy) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vacancy.jobTitle?.toLowerCase().includes(query) ||
      vacancy.title.toLowerCase().includes(query) ||
      vacancy.description.toLowerCase().includes(query) ||
      vacancy.city?.toLowerCase().includes(query)
    );
  });

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💼</Text>
      <Text style={styles.emptyStateTitle}>Вакансии не найдены</Text>
      <Text style={styles.emptyStateText}>
        Новые вакансии появятся здесь
      </Text>
    </View>
  );

  if (isLoading && !vacancies) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderWithBack title="Вакансии" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderWithBack title="Вакансии" />
      
      <FlatList
        data={filteredVacancies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VacancyCard vacancy={item} onPress={() => handleVacancyPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

