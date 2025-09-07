import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants';
import { CustomerStackParamList, WorkerStackParamList } from '../../types/navigation';

type DocumentWebViewRouteProp = RouteProp<CustomerStackParamList | WorkerStackParamList, 'DocumentWebView'>;

export const DocumentWebViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<DocumentWebViewRouteProp>();
  const { url, title } = route.params;
  const [isLoading, setIsLoading] = useState(true);

  // Получаем высоту статус бара для Android
  const getStatusBarHeight = () => {
    if (Platform.OS === 'android') {
      return StatusBar.currentHeight || 24;
    }
    return 0;
  };

  const statusBarHeight = getStatusBarHeight();

  useEffect(() => {
    // Настраиваем статус бар
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setBackgroundColor('#FFFFFF', true);
    }
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Отступ для статус бара на Android */}
      {Platform.OS === 'android' && <View style={{ height: statusBarHeight, backgroundColor: '#FFFFFF' }} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView Container */}
      <View style={[styles.webViewContainer, Platform.OS === 'android' && { paddingBottom: 47 }]}>
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  placeholder: {
    width: 40,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
});