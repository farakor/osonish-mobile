import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { theme } from '../../constants';

export interface DropdownMenuItem {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  triggerStyle?: any;
  menuStyle?: any;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  triggerStyle,
  menuStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<TouchableOpacity>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const showMenu = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
        setTriggerLayout({ x: pageX, y: pageY, width, height });
        setIsVisible(true);

        // Анимация появления
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      });
    }
  };

  const hideMenu = () => {
    // Анимация исчезновения
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  const handleItemPress = (item: DropdownMenuItem) => {
    hideMenu();
    setTimeout(() => {
      item.onPress();
    }, 100);
  };

  return (
    <>
      <TouchableOpacity
        ref={triggerRef}
        style={[styles.trigger, triggerStyle]}
        onPress={showMenu}
        activeOpacity={0.7}
      >
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
      >
        <Pressable style={styles.overlay} onPress={hideMenu}>
          <Animated.View
            style={[
              styles.menu,
              menuStyle,
              {
                position: 'absolute',
                top: triggerLayout.y + triggerLayout.height + 8,
                right: 24, // Отступ от правого края экрана
                transform: [
                  {
                    scale: scaleAnim,
                  },
                ],
              },
            ]}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === items.length - 1 && styles.lastMenuItem,
                  item.disabled && styles.disabledMenuItem,
                ]}
                onPress={() => !item.disabled && handleItemPress(item)}
                disabled={item.disabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    { color: item.color || theme.colors.text.primary },
                    item.disabled && styles.disabledMenuItemText,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.text.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 8,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    textAlign: 'center',
  },
  disabledMenuItemText: {
    color: theme.colors.text.secondary,
  },
});
