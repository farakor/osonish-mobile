import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import LocationIcon from '../../../assets/card-icons/location.svg';
import { useCustomerTranslation, useErrorsTranslation } from '../../hooks/useTranslation';

interface OrderLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
  title?: string;
  containerStyle?: object;
}

export const OrderLocationMap: React.FC<OrderLocationMapProps> = ({
  latitude,
  longitude,
  address,
  title = "Куда ехать",
  containerStyle,
}) => {
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
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
  // Функция для открытия в Яндекс.Картах
  const openInYandexMaps = async () => {
    try {
      // Сначала пробуем открыть в приложении Яндекс.Карты
      const yandexMapsAppUrl = `yandexmaps://maps.yandex.ru/?rtext=~${latitude},${longitude}&rtt=auto`;
      const canOpenYandexMaps = await Linking.canOpenURL(yandexMapsAppUrl);

      if (canOpenYandexMaps) {
        await Linking.openURL(yandexMapsAppUrl);
      } else {
        // Если Яндекс.Карты не установлены, открываем веб-версию
        const yandexMapsWebUrl = `https://yandex.ru/maps/?rtext=~${latitude},${longitude}&rtt=auto`;
        await Linking.openURL(yandexMapsWebUrl);
      }
    } catch (error) {
      console.error('Ошибка при открытии навигации:', error);
      Alert.alert(tError('error'), t('navigation_error'));
    }
  };

  // Функция для открытия в других картах
  const openInMaps = () => {
    Alert.alert(
      t('choose_app'),
      t('choose_app_subtitle'),
      [
        {
          text: t('yandex_maps'),
          onPress: openInYandexMaps,
        },
        {
          text: t('google_maps'),
          onPress: () => {
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl);
          },
        },
        {
          text: t('apple_maps'),
          onPress: () => {
            const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
            Linking.openURL(appleMapsUrl);
          },
        },
        { text: tError('cancel'), style: 'cancel' }
      ]
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
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
            <LocationIcon width={18} height={18} color="#679B00" style={styles.buttonIcon} />
            <Text style={styles.routeButtonText}>{t('build_route')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  mapSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DAE3EC',
  },
  webViewMap: {
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  addressSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    borderColor: '#679B00',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  routeButtonText: {
    color: '#679B00',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 0,
  },
});
