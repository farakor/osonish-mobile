import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../constants/theme';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { useCommonTranslation } from '../../hooks/useTranslation';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  initialHour?: string;
  initialMinute?: string;
}



export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onTimeSelect,
  initialHour = '09',
  initialMinute = '00',
}) => {
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const tCommon = useCommonTranslation();

  // Инициализация времени при открытии модалки
  useEffect(() => {
    if (visible) {
      const date = new Date();
      date.setHours(parseInt(initialHour), parseInt(initialMinute), 0, 0);
      setSelectedTime(date);
    }
  }, [visible, initialHour, initialMinute]);

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const handleDone = () => {
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    onTimeSelect(timeString);
    onClose();
  };

  const handleIOSTimeChange = (event: any, date?: Date) => {
    if (event.type === 'dismissed') {
      onClose();
      return;
    }

    if (date) {
      handleTimeChange(event, date);
      handleDone();
    }
  };

  if (Platform.OS === 'ios') {
    // На iOS используем compact режим, который показывает нативный пикер
    return visible ? (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        is24Hour={true}
        display="compact"
        onChange={handleIOSTimeChange}
        minuteInterval={15}
        locale="ru-RU"
        themeVariant="light"
      />
    ) : null;
  }

  // На Android показываем стандартный пикер времени
  return visible ? (
    <DateTimePicker
      value={selectedTime}
      mode="time"
      is24Hour={true}
      display="default"
      onChange={(event, date) => {
        if (date) {
          handleTimeChange(event, date);
          handleDone();
        } else {
          onClose();
        }
      }}
      minuteInterval={15}
      locale="ru-RU"
    />
  ) : null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    width: '85%',
    maxWidth: 320,
    aspectRatio: 1.2,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  timePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  timePicker: {
    width: '100%',
    height: 150,
  },
});
