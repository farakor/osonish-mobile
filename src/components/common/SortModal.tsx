import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { theme } from '../../constants';
import Calendar5Icon from '../../../assets/calendar-5.svg';
import EyeArrowProgressIcon from '../../../assets/eye-arrow-progress.svg';
import MoneyBillWaveIcon from '../../../assets/money-bill-wave.svg';

export type SortOption = 'date' | 'views' | 'price';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  translations: {
    title: string;
    sortByDate: string;
    sortByViews: string;
    sortByPrice: string;
  };
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  currentSort,
  onSelectSort,
  translations,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

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
          toValue: 300,
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
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
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
        // Если свайп больше 100px или скорость больше 0.5 - закрываем
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
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

  const handleSelectSort = (sort: SortOption) => {
    onSelectSort(sort);
    closeBottomSheet();
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
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Верхняя область для свайпа - ручка + заголовок */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            
            <Text style={styles.title}>{translations.title}</Text>
          </View>
          
          <View style={styles.content}>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  currentSort === 'date' && styles.optionActive
                ]}
                onPress={() => handleSelectSort('date')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <Calendar5Icon width={24} height={24} />
                  </View>
                  <Text style={[
                    styles.optionText,
                    currentSort === 'date' && styles.optionTextActive
                  ]}>
                    {translations.sortByDate}
                  </Text>
                </View>
                {currentSort === 'date' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  currentSort === 'views' && styles.optionActive
                ]}
                onPress={() => handleSelectSort('views')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <EyeArrowProgressIcon width={24} height={24} />
                  </View>
                  <Text style={[
                    styles.optionText,
                    currentSort === 'views' && styles.optionTextActive
                  ]}>
                    {translations.sortByViews}
                  </Text>
                </View>
                {currentSort === 'views' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  currentSort === 'price' && styles.optionActive
                ]}
                onPress={() => handleSelectSort('price')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={styles.iconContainer}>
                    <MoneyBillWaveIcon width={24} height={24} />
                  </View>
                  <Text style={[
                    styles.optionText,
                    currentSort === 'price' && styles.optionTextActive
                  ]}>
                    {translations.sortByPrice}
                  </Text>
                </View>
                {currentSort === 'price' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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
  modalContainer: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
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
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: theme.colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 24,
  },
  optionText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  optionTextActive: {
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.bold,
  },
});




















