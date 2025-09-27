import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants';
import { LocationCoords } from '../../services/locationService';
import { useCustomerTranslation, useErrorsTranslation } from '../../hooks/useTranslation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (coords: LocationCoords, address?: string) => void;
  initialCoords?: LocationCoords;
  initialAddress?: string;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialCoords,
  initialAddress
}) => {
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const webViewRef = useRef<WebView>(null);
  const [selectedCoords, setSelectedCoords] = useState<LocationCoords | null>(initialCoords || null);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress || '');

  // Определяем центр карты (Самарканд по умолчанию)
  const defaultCenter = { latitude: 39.6270, longitude: 66.9750 };
  const mapCenter = initialCoords || defaultCenter;

  // HTML шаблон для интерактивной Яндекс карты
  const mapHTML = `
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
          .address-display {
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            max-height: 80px;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <div class="controls">
          Нажмите на карту, чтобы выбрать местоположение
        </div>
        <div id="map"></div>
        <div class="address-display" id="addressDisplay">
          ${initialAddress || 'Выберите точку на карте'}
        </div>
        
        <script type="text/javascript">
          let map, placemark;
          let selectedCoords = ${initialCoords ? `[${initialCoords.latitude}, ${initialCoords.longitude}]` : 'null'};
          
          ymaps.ready(function () {
            map = new ymaps.Map('map', {
              center: [${mapCenter.latitude}, ${mapCenter.longitude}],
              zoom: 15,
              controls: ['zoomControl', 'geolocationControl']
            });

            // Добавляем начальную метку если есть координаты
            if (selectedCoords) {
              addPlacemark(selectedCoords);
            }

            // Обработчик клика по карте
            map.events.add('click', function (e) {
              const coords = e.get('coords');
              selectedCoords = coords;
              
              // Удаляем предыдущую метку
              if (placemark) {
                map.geoObjects.remove(placemark);
              }
              
              // Добавляем новую метку
              addPlacemark(coords);
              
              // Получаем адрес по координатам
              ymaps.geocode(coords).then(function (res) {
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
                    latitude: coords[0],
                    longitude: coords[1]
                  },
                  address: address
                }));
              });
            });
          });
          
          function addPlacemark(coords) {
            placemark = new ymaps.Placemark(coords, {
              balloonContent: 'Выбранное местоположение'
            }, {
              preset: 'islands#redDotIcon',
              draggable: true
            });
            
            map.geoObjects.add(placemark);
            
            // Обработчик перетаскивания метки
            placemark.events.add('dragend', function () {
              const newCoords = placemark.geometry.getCoordinates();
              selectedCoords = newCoords;
              
              ymaps.geocode(newCoords).then(function (res) {
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
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'locationSelected',
                  coords: {
                    latitude: newCoords[0],
                    longitude: newCoords[1]
                  },
                  address: address
                }));
              });
            });
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
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения от WebView:', error);
    }
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords, selectedAddress);
      onClose();
    } else {
      Alert.alert(tError('error'), 'Пожалуйста, выберите местоположение на карте');
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Заголовок */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Отмена</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Выберите местоположение</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.confirmButton, !selectedCoords && styles.confirmButtonDisabled]}
            disabled={!selectedCoords}
          >
            <Text style={[styles.confirmButtonText, !selectedCoords && styles.confirmButtonTextDisabled]}>
              Готово
            </Text>
          </TouchableOpacity>
        </View>

        {/* Карта */}
        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
          allowsInlineMediaPlayback={true}
        />

        {/* Информация о выбранном адресе */}
        {selectedAddress && (
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Выбранный адрес:</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {selectedAddress}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  confirmButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.white,
  },
  confirmButtonTextDisabled: {
    color: theme.colors.text.secondary,
  },
  webView: {
    flex: 1,
  },
  addressInfo: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addressLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
});
