import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants';
import { LocationCoords } from '../../services/locationService';
import { useCustomerTranslation } from '../../hooks/useTranslation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EmbeddedMapSelectorProps {
  onLocationSelect: (coords: LocationCoords, address?: string) => void;
  initialCoords?: LocationCoords;
  initialAddress?: string;
  location: string;
}

export const EmbeddedMapSelector: React.FC<EmbeddedMapSelectorProps> = ({
  onLocationSelect,
  initialCoords,
  initialAddress,
  location
}) => {
  const t = useCustomerTranslation();
  const webViewRef = useRef<WebView>(null);
  const [selectedCoords, setSelectedCoords] = useState<LocationCoords | null>(initialCoords || null);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress || location || '');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Определяем центр карты (Самарканд по умолчанию)
  const defaultCenter = { latitude: 39.6270, longitude: 66.9750 };
  const mapCenter = initialCoords || defaultCenter;

  // HTML шаблон для интерактивной Яндекс карты
  const createMapHTML = (isExpanded: boolean = false) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <script src="https://api-maps.yandex.ru/2.1/?apikey=445ec733-779c-4724-9843-4c3f805eb96b&lang=ru_RU" type="text/javascript"></script>
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          ${!isExpanded ? `
          .controls {
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 8px;
            border-radius: 6px;
            font-size: 11px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .expand-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            border: none;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            font-size: ${isExpanded ? '32px' : '24px'};
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          ` : `
          .controls {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            font-size: ${isExpanded ? '32px' : '24px'};
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
          `}
          .address-display {
            position: absolute;
            bottom: ${isExpanded ? '10px' : '8px'};
            left: ${isExpanded ? '10px' : '8px'};
            right: ${isExpanded ? '10px' : '8px'};
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: ${isExpanded ? '12px' : '8px'};
            border-radius: ${isExpanded ? '8px' : '6px'};
            font-size: ${isExpanded ? '14px' : '12px'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-height: ${isExpanded ? '80px' : '60px'};
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <div class="controls">
          ${t('move_map_to_select')}
        </div>
        ${!isExpanded ? '<button class="expand-btn" onclick="expandMap()">⛶</button>' : ''}
        <div id="map"></div>
        <div class="center-pin">📍</div>
        <div class="address-display" id="addressDisplay">
          ${selectedAddress || location || t('move_map_to_select')}
        </div>
        
        <script type="text/javascript">
          let map, placemark;
          let selectedCoords = ${selectedCoords ? `[${selectedCoords.latitude}, ${selectedCoords.longitude}]` : 'null'};
          let lastUpdateCoords = null;
          let userInteracted = false;
          
          ymaps.ready(function () {
            map = new ymaps.Map('map', {
              center: [${mapCenter.latitude}, ${mapCenter.longitude}],
              zoom: ${isExpanded ? '15' : '14'},
              controls: ['zoomControl', ${isExpanded ? "'geolocationControl'" : ''}]
            });

            // Функция для обновления координат центра карты
            function updateCenterCoords() {
              const center = map.getCenter();
              
              // Проверяем, изменились ли координаты значительно (более чем на 0.001 градуса)
              if (lastUpdateCoords && 
                  Math.abs(center[0] - lastUpdateCoords[0]) < 0.001 && 
                  Math.abs(center[1] - lastUpdateCoords[1]) < 0.001) {
                return; // Не обновляем, если изменения незначительные
              }
              
              lastUpdateCoords = center;
              selectedCoords = center;
              
              // Получаем адрес по координатам
              ymaps.geocode(center).then(function (res) {
                const firstGeoObject = res.geoObjects.get(0);
                let address = firstGeoObject ? firstGeoObject.getAddressLine() : 'Адрес не найден';
                
                // Убираем название страны из адреса
                if (address && address !== 'Адрес не найден') {
                  // Убираем "Узбекистан" в начале или конце адреса
                  address = address.replace(/^Узбекистан,?\s*/i, '').replace(/,?\s*Узбекистан$/i, '');
                  // Убираем "Uzbekistan" в начале или конце адреса
                  address = address.replace(/^Uzbekistan,?\s*/i, '').replace(/,?\s*Uzbekistan$/i, '');
                  // Убираем лишние запятые в начале
                  address = address.replace(/^,\s*/, '');
                }
                
                document.getElementById('addressDisplay').textContent = address;
                
                // Отправляем данные в React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelected',
                  coords: {
                    latitude: center[0],
                    longitude: center[1]
                  },
                  address: address
                }));
              });
            }

            // Отслеживаем начало взаимодействия пользователя
            map.events.add('actionbegin', function (e) {
              userInteracted = true;
            });

            // Обработчик окончания движения карты
            map.events.add('actionend', function (e) {
              // Обновляем только если пользователь взаимодействовал с картой
              if (userInteracted) {
                updateCenterCoords();
              }
            });

            // НЕ инициализируем автоматически - только после ручного движения карты
          });

          function expandMap() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'expandMap'
            }));
          }
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'locationSelected') {
        setSelectedCoords(data.coords);
        setSelectedAddress(data.address);
        onLocationSelect(data.coords, data.address);
      } else if (data.type === 'expandMap') {
        setIsFullScreen(true);
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения от WebView:', error);
    }
  };

  const handleFullScreenClose = () => {
    setIsFullScreen(false);
  };

  return (
    <>
      {/* Встроенная карта */}
      <View style={styles.embeddedMapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: createMapHTML(false) }}
          style={styles.embeddedWebView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
        />
      </View>

      {/* Полноэкранная карта */}
      <Modal
        visible={isFullScreen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFullScreenClose}
      >
        <View style={styles.fullScreenContainer}>
          {/* Заголовок */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={handleFullScreenClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Готово</Text>
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle}>Выберите местоположение</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Полноэкранная карта */}
          <WebView
            source={{ html: createMapHTML(true) }}
            style={styles.fullScreenWebView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  embeddedMapContainer: {
    height: 160,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  embeddedWebView: {
    flex: 1,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  fullScreenTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  headerSpacer: {
    width: 60, // Примерная ширина кнопки для центрирования заголовка
  },
  fullScreenWebView: {
    flex: 1,
  },
});
