import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../types';
import { theme, getTranslatedSpecializationName, getTopLevelCategories, getSubcategoriesByParentId } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { CategoryIcon } from '../../components/common';
import { useNavigationTranslation, useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'Categories'>;

const { width: screenWidth } = Dimensions.get('window');
// Для 3 колонок: вычитаем отступы контейнера и делим на 3
const categoryCardWidth = (screenWidth - theme.spacing.lg * 2) / 3 - theme.spacing.sm;

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

  // Определяем, какие категории показывать
  const categories = parentCategoryId 
    ? getSubcategoriesByParentId(parentCategoryId)
    : getTopLevelCategories();

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

        {/* Categories Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
              >
                <CategoryIcon
                  icon={category.icon}
                  iconComponent={category.iconComponent}
                  size={32}
                  style={styles.categoryIconWrapper}
                />
                <Text style={styles.categoryName} numberOfLines={2}>
                  {getTranslatedSpecializationName(category.id, tCommon)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Message */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {tCustomer('category_not_found_hint')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FC',
  },
  content: {
    flex: 1,
    backgroundColor: '#F4F5FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: '#F4F5FC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...lightElevationStyles,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    paddingTop: 5,
    paddingBottom: theme.spacing.xxl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: categoryCardWidth,
    height: categoryCardWidth * 1.2,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...lightElevationStyles,
  },
  categoryIconWrapper: {
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 13,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
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

