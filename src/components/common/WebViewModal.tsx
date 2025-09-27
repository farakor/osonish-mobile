import React from 'react';
import { Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet, StatusBar,
  Platform,
  ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';

interface WebViewModalProps {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

export const WebViewModal: React.FC<WebViewModalProps> = ({ visible, url, title, onClose }) => {
  const [loading, setLoading] = React.useState(true);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.placeholder} />
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Загрузка...</Text>
            </View>
          )}

          <WebView
            source={{ uri: url }}
            style={styles.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)}
            startInLoadingState={true}
            scalesPageToFit={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            allowsBackForwardNavigationGestures={true}
          />
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  placeholder: {
    width: 32,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});
