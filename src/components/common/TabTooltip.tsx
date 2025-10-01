import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';

interface TabTooltipProps {
  visible: boolean;
  text: string;
  color?: string;
  onDismiss?: () => void;
}

export const TabTooltip: React.FC<TabTooltipProps> = ({
  visible,
  text,
  color = '#E10000',
  onDismiss
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, translateY]);

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onDismiss}
      style={{ position: 'absolute' }}
    >
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: color,
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.tooltipText}>{text}</Text>
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={[styles.arrow, { borderTopColor: color }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -90,
    paddingHorizontal: 10,
    paddingVertical: 12,
    paddingRight: 28,
    paddingLeft: 10,
    borderRadius: 6,
    width: 180,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
    flexShrink: 1,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  arrow: {
    position: 'absolute',
    bottom: -5,
    left: '70%',
    marginLeft: -5,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 0,
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});

