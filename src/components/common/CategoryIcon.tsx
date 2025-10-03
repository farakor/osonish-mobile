import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface CategoryIconProps {
  icon: string;
  iconComponent?: React.ComponentType<any>;
  size?: number;
  style?: any;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  iconComponent: IconComponent,
  size = 32,
  style,
}) => {
  if (IconComponent) {
    return (
      <View style={[styles.iconContainer, { width: size, height: size }, style]}>
        <IconComponent width={size} height={size} />
      </View>
    );
  }

  return (
    <Text style={[styles.emojiIcon, { fontSize: size }, style]}>
      {icon}
    </Text>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    textAlign: 'center',
  },
});

