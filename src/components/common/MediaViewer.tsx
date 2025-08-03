import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import ImageViewing from 'react-native-image-viewing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MediaViewerProps {
  uri: string;
  isVideo: boolean;
  style?: any;
  children?: React.ReactNode;
  imageIndex?: number;
  allImages?: string[];
}

// Отдельный компонент для видео, который полностью переинициализируется
const VideoPlayerComponent: React.FC<{ uri: string; onClose: () => void }> = ({ uri, onClose }) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isComponentMounted, setIsComponentMounted] = useState(true);

  const player = useVideoPlayer(uri, player => {
    player.loop = false;
  });

  React.useEffect(() => {
    setIsComponentMounted(true);

    // Для Android увеличиваем задержку
    const delay = Platform.OS === 'android' ? 800 : 200;

    const timer = setTimeout(() => {
      if (isComponentMounted) {
        try {
          setIsPlayerReady(true);
          player.play();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      setIsComponentMounted(false);
      setIsPlayerReady(false);

      // Безопасная остановка плеера
      try {
        player.pause();
        player.currentTime = 0;
      } catch (error) {
        // Игнорируем ошибки при очистке - плеер может быть уже освобожден
        console.log('Video player cleanup (expected):', error.message);
      }
    };
  }, [player]);

  // Дополнительная очистка при размонтировании
  React.useEffect(() => {
    return () => {
      setIsComponentMounted(false);
    };
  }, []);

  if (!isComponentMounted) {
    return null;
  }

  return (
    <View style={styles.fullscreenContainer}>
      {Platform.OS === 'android' && !isPlayerReady && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Подготовка видео...</Text>
        </View>
      )}
      {player && (
        <VideoView
          style={[
            styles.fullscreenVideo,
            Platform.OS === 'android' && !isPlayerReady && { opacity: 0 }
          ]}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          nativeControls={true}
        />
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

// Компонент для полноэкранного видео плеера
const FullscreenVideoModal: React.FC<{
  visible: boolean;
  uri: string;
  onClose: () => void;
}> = ({ visible, uri, onClose }) => {
  const [modalKey, setModalKey] = useState(0);

  React.useEffect(() => {
    if (visible) {
      // Создаем новый ключ для полной переинициализации
      setModalKey(prev => prev + 1);
    }
  }, [visible, uri]);

  const handleClose = () => {
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <VideoPlayerComponent
        key={`video-modal-${modalKey}-${uri}-${Date.now()}`}
        uri={uri}
        onClose={handleClose}
      />
    </Modal>
  );
};

export const MediaViewer: React.FC<MediaViewerProps> = ({
  uri,
  isVideo,
  style,
  children,
  imageIndex = 0,
  allImages = [],
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handlePress = () => {
    if (isVideo) {
      setShowVideoModal(true);
    } else {
      setShowImageViewer(true);
    }
  };

  const handleVideoClose = () => {
    setShowVideoModal(false);
  };

  // Подготавливаем данные для ImageViewing
  const imageViewingData = allImages.length > 0
    ? allImages
      .filter(item => !isVideoFile(item))
      .map(imageUri => ({ uri: imageUri }))
    : [{ uri }];

  const currentImageIndex = allImages.length > 0 && !isVideoFile(uri)
    ? allImages.filter(item => !isVideoFile(item)).indexOf(uri)
    : 0;

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          style,
          { opacity: pressed ? 0.8 : 1 }
        ]}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        <View style={styles.mediaContainer}>
          {children}
          {/* Индикатор видео */}
          {isVideo && (
            <View style={styles.videoIndicator}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>

      {/* Просмотрщик изображений */}
      <ImageViewing
        images={imageViewingData}
        imageIndex={Math.max(0, currentImageIndex)}
        visible={showImageViewer}
        onRequestClose={() => setShowImageViewer(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        presentationStyle="overFullScreen"
      />

      {/* Полноэкранное видео */}
      <FullscreenVideoModal
        visible={showVideoModal}
        uri={uri}
        onClose={handleVideoClose}
      />
    </>
  );
};

// Вспомогательная функция для определения видео файлов
const isVideoFile = (uri: string): boolean => {
  return /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?|$)/i.test(uri) ||
    uri.includes('video') ||
    uri.includes('/video/') ||
    uri.includes('_video_');
};

const styles = StyleSheet.create({
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playIcon: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 3, // Небольшой сдвиг для визуального центрирования треугольника
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});