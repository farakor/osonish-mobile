import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';

interface TabTooltipProps {
  visible: boolean;
  text: string;
  color?: string;
}

export const TabTooltip: React.FC<TabTooltipProps> = ({
  visible,
  text,
  color = '#E10000'
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
      <View style={[styles.arrow, { borderTopColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    marginLeft: -75,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 150,
    maxWidth: 180,
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
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  arrow: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
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

