import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import { theme } from '../../constants';
import ChevronDownIcon from '../../../assets/chevron-down.svg';

export interface FilterItem {
  id: string;
  name: string;
  count: number;
  IconComponent?: React.ComponentType<any>;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  availableSpecializations: FilterItem[];
  availableCities: FilterItem[];
  selectedSpecialization: string | null;
  selectedCity: string | null;
  onSpecializationChange: (id: string) => void;
  onCityChange: (id: string) => void;
  onReset: () => void;
  translations: {
    filterByCategory: string;
    allCategories: string;
    filterByCity: string;
    allCities: string;
    resetFilters: string;
    apply: string;
  };
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  title,
  availableSpecializations,
  availableCities,
  selectedSpecialization,
  selectedCity,
  onSpecializationChange,
  onCityChange,
  onReset,
  translations,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Функция закрытия с анимацией
  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Сбрасываем состояние дропдаунов при закрытии
      setIsCategoryDropdownOpen(false);
      setIsCityDropdownOpen(false);
    });
  };

  // PanResponder для обработки свайпа вниз
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Активируем только при свайпе вниз
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Перемещаем bottom sheet только вниз (не вверх)
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Если свайп больше 150px или скорость больше 0.5 - закрываем
        if (gestureState.dy > 150 || gestureState.vy > 0.5) {
          closeBottomSheet();
        } else {
          // Возвращаем на место
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleApply = () => {
    closeBottomSheet();
  };

  const handleReset = () => {
    onReset();
    setIsCategoryDropdownOpen(false);
    setIsCityDropdownOpen(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeBottomSheet}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeBottomSheet}
        />
        
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Верхняя область для свайпа - ручка + заголовок */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            
            <Text style={styles.title}>{title}</Text>
          </View>
          
          {/* Контент с прокруткой */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.dropdownContainer}>
              {/* Дропдаун для категорий */}
              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>{translations.filterByCategory}</Text>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownHeaderText}>
                    {availableSpecializations.find(s => s.id === selectedSpecialization)?.name || translations.allCategories}
                  </Text>
                  <ChevronDownIcon 
                    width={20} 
                    height={20} 
                    style={[
                      styles.dropdownChevron,
                      isCategoryDropdownOpen && styles.dropdownChevronOpen
                    ]} 
                  />
                </TouchableOpacity>
                {isCategoryDropdownOpen && (
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableSpecializations.map((item) => {
                      const IconComponent = item.IconComponent;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.dropdownItem,
                            selectedSpecialization === item.id && styles.dropdownItemActive
                          ]}
                          onPress={() => {
                            onSpecializationChange(item.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          {IconComponent && (
                            <IconComponent 
                              width={20} 
                              height={20} 
                              style={[
                                styles.dropdownItemIcon,
                                selectedSpecialization === item.id && styles.dropdownItemIconActive
                              ]} 
                            />
                          )}
                          <Text style={[
                            styles.dropdownItemText,
                            selectedSpecialization === item.id && styles.dropdownItemTextActive
                          ]}>
                            {item.name}
                          </Text>
                          <Text style={[
                            styles.dropdownItemCount,
                            selectedSpecialization === item.id && styles.dropdownItemCountActive
                          ]}>
                            ({item.count})
                          </Text>
                          {selectedSpecialization === item.id && (
                            <Text style={styles.dropdownItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Дропдаун для городов */}
              <View style={styles.dropdownSection}>
                <Text style={styles.dropdownLabel}>{translations.filterByCity}</Text>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownHeaderText}>
                    {availableCities.find(c => c.id === selectedCity)?.name || translations.allCities}
                  </Text>
                  <ChevronDownIcon 
                    width={20} 
                    height={20} 
                    style={[
                      styles.dropdownChevron,
                      isCityDropdownOpen && styles.dropdownChevronOpen
                    ]} 
                  />
                </TouchableOpacity>
                {isCityDropdownOpen && (
                  <ScrollView 
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableCities.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.dropdownItem,
                          selectedCity === item.id && styles.dropdownItemActive
                        ]}
                        onPress={() => {
                          onCityChange(item.id);
                          setIsCityDropdownOpen(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          selectedCity === item.id && styles.dropdownItemTextActive
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.dropdownItemCount,
                          selectedCity === item.id && styles.dropdownItemCountActive
                        ]}>
                          ({item.count})
                        </Text>
                        {selectedCity === item.id && (
                          <Text style={styles.dropdownItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Кнопки применить и сбросить */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>{translations.resetFilters}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>{translations.apply}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  scrollContent: {
    maxHeight: '70%',
  },
  dropdownContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  dropdownSection: {
    marginBottom: theme.spacing.lg,
  },
  dropdownLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  dropdownHeaderText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
    flex: 1,
  },
  dropdownChevron: {
    tintColor: theme.colors.text.secondary,
  },
  dropdownChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownScrollView: {
    maxHeight: 180,
    marginTop: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemIcon: {
    marginRight: theme.spacing.sm,
    tintColor: theme.colors.text.secondary,
  },
  dropdownItemIconActive: {
    tintColor: theme.colors.primary,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  dropdownItemTextActive: {
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.primary,
  },
  dropdownItemCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  dropdownItemCountActive: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  resetButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
});

