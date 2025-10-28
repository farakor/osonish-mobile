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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../types';
import { theme, SPECIALIZATIONS, getTranslatedSpecializationName } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { CategoryIcon } from '../../components/common';
import { useNavigationTranslation, useCustomerTranslation } from '../../hooks/useTranslation';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'Categories'>;

const { width: screenWidth } = Dimensions.get('window');
const categoryCardWidth = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 3) / 4;

const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const t = useNavigationTranslation();
  const tCustomer = useCustomerTranslation();
  const { t: tCommon } = useTranslation();

  const handleCategoryPress = (specializationId: string) => {
    navigation.navigate('ProfessionalMastersList', { specializationId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: theme.spacing.lg + getAndroidStatusBarHeight() }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('categories')}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Categories Grid */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesGrid}>
            {SPECIALIZATIONS.map((category) => (
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
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
    fontSize: 11,
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

