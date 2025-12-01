import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
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
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;

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

  const handleItemPress = (item: ActionBottomSheetItem) => {
    if (!item.disabled) {
      onClose();
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
      onRequestClose={onClose}
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
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.content}>
            {title && <Text style={styles.title}>{title}</Text>}
            
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
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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

