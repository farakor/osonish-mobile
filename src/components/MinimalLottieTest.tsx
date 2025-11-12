import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MinimalLottieTest: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/osonish-animation.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: '#ff0000', // Красный фон - если виден, значит компонент загрузился
  },
});

