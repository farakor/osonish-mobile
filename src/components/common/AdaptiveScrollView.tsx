import React from 'react';
import { ScrollView, ScrollViewProps, KeyboardAvoidingView, Platform } from 'react-native';
import { isSmallScreen } from '../../utils/responsive';

interface AdaptiveScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  keyboardAvoiding?: boolean;
}

export const AdaptiveScrollView: React.FC<AdaptiveScrollViewProps> = ({
  children,
  keyboardAvoiding = true,
  contentContainerStyle,
  ...props
}) => {
  const isSmall = isSmallScreen();

  const adaptiveContentContainerStyle = [
    {
      flexGrow: 1,
      paddingBottom: isSmall ? 16 : 24, // Меньший отступ снизу для маленьких экранов
    },
    contentContainerStyle,
  ];

  const scrollViewProps = {
    ...props,
    contentContainerStyle: adaptiveContentContainerStyle,
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
    // На маленьких экранах делаем скролл более отзывчивым
    scrollEventThrottle: isSmall ? 8 : 16,
  };

  if (keyboardAvoiding && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={isSmall ? 60 : 80}
      >
        <ScrollView {...scrollViewProps}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView {...scrollViewProps}>
      {children}
    </ScrollView>
  );
};
