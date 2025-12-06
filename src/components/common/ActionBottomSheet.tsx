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

export interface ActionBottomSheetItem {
  id: string;
  title: string;
  icon?: string | React.ReactNode;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ActionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  items: ActionBottomSheetItem[];
  title?: string;
}

export const ActionBottomSheet: React.FC<ActionBottomSheetProps> = ({
  visible,
  onClose,
  items,
  title,
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

  const handleItemPress = (item: ActionBottomSheetItem) => {
    if (!item.disabled) {
      closeBottomSheet();
      // Задержка для плавности закрытия
      setTimeout(() => {
        item.onPress();
      }, 100);
    }
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
            
            {title && <Text style={styles.title}>{title}</Text>}
          </View>
          
          <View style={styles.content}>
            <View style={styles.optionsContainer}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.option,
                    item.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => handleItemPress(item)}
                  disabled={item.disabled}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    {item.icon && (
                      <View style={styles.iconContainer}>
                        {typeof item.icon === 'string' ? (
                          <Text style={styles.optionIcon}>{item.icon}</Text>
                        ) : (
                          item.icon
                        )}
                      </View>
                    )}
                    <Text style={[
                      styles.optionText,
                      { color: item.color || theme.colors.text.primary },
                      item.disabled && styles.optionTextDisabled,
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
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
    justifyContent: 'flex-start',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionDisabled: {
    opacity: 0.5,
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
  },
  optionTextDisabled: {
    color: theme.colors.text.secondary,
  },
});

