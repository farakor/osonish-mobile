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
import { theme, SPECIALIZATIONS } from '../../constants';
import { lightElevationStyles } from '../../utils/noShadowStyles';
import { CategoryIcon } from '../../components/common';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'Categories'>;

const { width: screenWidth } = Dimensions.get('window');
const categoryCardWidth = (screenWidth - theme.spacing.lg * 2 - theme.spacing.sm * 3) / 4;

const getAndroidStatusBarHeight = () => {
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
};

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Категории</Text>
          <View style={styles.backButton} />
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
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
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
});

