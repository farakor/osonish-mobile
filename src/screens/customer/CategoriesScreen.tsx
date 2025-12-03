import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../types';
import { theme, getTranslatedSpecializationName, getTopLevelCategories, getSubcategoriesByParentId, SPECIALIZATIONS, PARENT_CATEGORIES, SpecializationOption } from '../../constants';
import { CategoryIcon } from '../../components/common';
import { useNavigationTranslation, useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import ArrowRightIcon from '../../../assets/arrow-narrow-right.svg';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'Categories'>;

const { width: screenWidth } = Dimensions.get('window');

const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<CustomerStackParamList, 'Categories'>>();
  const parentCategoryId = route.params?.parentCategoryId;
  
  const t = useNavigationTranslation();
  const tCustomer = useCustomerTranslation();
  const { t: tCommon } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');

  // Определяем, какие категории показывать
  const categories = parentCategoryId 
    ? getSubcategoriesByParentId(parentCategoryId)
    : getTopLevelCategories();

  // Функция для поиска по категориям и подкатегориям
  const searchInAllCategories = (query: string): SpecializationOption[] => {
    if (!query.trim()) {
      return categories;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results: SpecializationOption[] = [];

    // Поиск в текущих категориях
    categories.forEach((category) => {
      const translatedName = getTranslatedSpecializationName(category.id, tCommon).toLowerCase();
      
      if (translatedName.includes(lowerQuery)) {
        results.push(category);
      }

      // Если это родительская категория, ищем в её подкатегориях
      if (category.isParent) {
        const subcategories = getSubcategoriesByParentId(category.id);
        subcategories.forEach((subcat) => {
          const subcatName = getTranslatedSpecializationName(subcat.id, tCommon).toLowerCase();
          if (subcatName.includes(lowerQuery)) {
            // Добавляем подкатегорию с пометкой о родительской категории
            results.push({
              ...subcat,
              parentCategoryName: getTranslatedSpecializationName(category.id, tCommon),
            } as any);
          }
        });
      }
    });

    return results;
  };

  // Фильтрованные категории
  const filteredCategories = useMemo(() => {
    return searchInAllCategories(searchQuery);
  }, [searchQuery, categories, tCommon]);

  const handleCategoryPress = (specializationId: string) => {
    const category = categories.find(c => c.id === specializationId);
    
    // Если это родительская категория, показываем её подкатегории
    if (category?.isParent) {
      // @ts-ignore - push существует в NativeStackNavigationProp
      navigation.push('Categories', { parentCategoryId: specializationId });
    } else {
      // Иначе переходим к списку мастеров
      navigation.navigate('ProfessionalMastersList', { specializationId });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Определяем заголовок
  const headerTitle = parentCategoryId
    ? getTranslatedSpecializationName(parentCategoryId, tCommon)
    : t('categories');

  const renderCategoryItem = ({ item: category }: { item: SpecializationOption }) => (
    <TouchableOpacity
      style={styles.categoryListItem}
      onPress={() => handleCategoryPress(category.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconContainer}>
        <CategoryIcon
          icon={category.icon}
          iconComponent={category.iconComponent}
          size={32}
          style={styles.categoryIcon}
        />
      </View>
      
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {getTranslatedSpecializationName(category.id, tCommon)}
        </Text>
        {(category as any).parentCategoryName && (
          <Text style={styles.parentCategoryLabel} numberOfLines={1}>
            {(category as any).parentCategoryName}
          </Text>
        )}
      </View>
      
      <View style={styles.chevronContainer}>
        <ArrowRightIcon 
          width={20} 
          height={20} 
          stroke={theme.colors.text.secondary} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {tCustomer('no_categories_found') || 'Категории не найдены'}
      </Text>
    </View>
  );

  const renderListFooter = () => {
    if (filteredCategories.length > 0 && !searchQuery) {
      return (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {tCustomer('category_not_found_hint')}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={tCustomer('search_categories_placeholder') || 'Поиск категорий...'}
              placeholderTextColor={theme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories List */}
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderListFooter}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.text.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 5,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    padding: theme.spacing.sm,
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  categoryIcon: {
    // Стили для иконки применяются из CategoryIcon
  },
  categoryInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  parentCategoryLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  chevronContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

