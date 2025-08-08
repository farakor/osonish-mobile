import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants';
import LocationIcon from '../../../assets/card-icons/location.svg';

interface OrderLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  title?: string;
}

export const OrderLocationMap: React.FC<OrderLocationMapProps> = ({
  latitude,
  longitude,
  address,
  title = "Куда ехать"
}) => {
  // HTML шаблон для Яндекс карты
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
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script type="text/javascript">
          ymaps.ready(function () {
            var map = new ymaps.Map('map', {
              center: [${latitude}, ${longitude}],
              zoom: 16,
              controls: ['zoomControl']
            });

            var placemark = new ymaps.Placemark([${latitude}, ${longitude}], {
              balloonContent: '${address.replace(/'/g, "\\'")}',
              hintContent: 'Место выполнения заказа'
            }, {
              preset: 'islands#redDotIcon'
            });

            map.geoObjects.add(placemark);
            
            // Отключаем взаимодействие для лучшей производительности в WebView
            map.behaviors.disable('scrollZoom');
          });
        </script>
      </body>
    </html>
  `;
  // Функция для открытия в Яндекс.Навигаторе
  const openInYandexNavigator = async () => {
    try {
      // Сначала пробуем открыть в Яндекс.Навигаторе
      const yandexNavUrl = `yandexnavi://build_route_on_map?lat_to=${latitude}&lon_to=${longitude}`;
      const canOpenYandexNav = await Linking.canOpenURL(yandexNavUrl);

      if (canOpenYandexNav) {
        await Linking.openURL(yandexNavUrl);
      } else {
        // Если Яндекс.Навигатор не установлен, открываем в Яндекс.Картах в браузере
        const yandexMapsUrl = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
        await Linking.openURL(yandexMapsUrl);
      }
    } catch (error) {
      console.error('Ошибка при открытии навигации:', error);
      Alert.alert('Ошибка', 'Не удалось открыть навигацию');
    }
  };

  // Функция для открытия в других картах
  const openInMaps = () => {
    Alert.alert(
      'Выберите приложение',
      'В каком приложении открыть маршрут?',
      [
        {
          text: 'Яндекс.Навигатор',
          onPress: openInYandexNavigator,
        },
        {
          text: 'Google Maps',
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl);
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
            Linking.openURL(appleMapsUrl);
          },
        },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок без иконки */}
      <Text style={styles.title}>{title}</Text>

      {/* Единая секция с картой, адресом и кнопкой */}
      <View style={styles.mapSection}>
        {/* Яндекс карта через WebView */}
        <WebView
          source={{ html: mapHTML }}
          style={styles.webViewMap}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          mixedContentMode="compatibility"
        />

        {/* Адрес и кнопка под картой в той же секции */}
        <View style={styles.addressSection}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
          <TouchableOpacity
            style={styles.routeButton}
            onPress={openInMaps}
            activeOpacity={0.8}
          >
            <LocationIcon width={18} height={18} color={theme.colors.primary} style={styles.buttonIcon} />
            <Text style={styles.routeButtonText}>Построить маршрут</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webViewMap: {
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  addressSection: {
    padding: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  routeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  routeButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 0,
  },
});
