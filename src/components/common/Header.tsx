import React from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Image } from 'react-native';
import { theme } from '../../constants';

interface HeaderProps {
  showStatusBar?: boolean;
  backgroundColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showStatusBar = true,
  backgroundColor = theme.colors.background
}) => {
  return (
    <>
      {showStatusBar && (
        <StatusBar
          barStyle="dark-content"
          backgroundColor={backgroundColor}
          translucent={false}
        />
      )}
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/logo-osonish-horizontal.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  header: {
    height: 90,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    height: 52,
    width: 190,
    maxWidth: '90%',
  },
}); 