import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { useSimpleSmsAutoFill } from '../../hooks/useSmsAutoFill';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface EnhancedSmsInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
  /**
   * Включить автозаполнение SMS для Android
   */
  enableAutoFill?: boolean;
  /**
   * Показывать ли индикатор автозаполнения
   */
  showAutoFillIndicator?: boolean;
  /**
   * Таймаут ожидания SMS (в миллисекундах)
   */
  autoFillTimeout?: number;
}

export interface EnhancedSmsInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  /**
   * Запустить прослушивание SMS вручную
   */
  startAutoFill: () => Promise<boolean>;
  /**
   * Остановить прослушивание SMS
   */
  stopAutoFill: () => void;
}

const EnhancedSmsInput = forwardRef<EnhancedSmsInputRef, EnhancedSmsInputProps>(({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  autoFocus = true,
  value = '',
  enableAutoFill = true,
  showAutoFillIndicator = true,
  autoFillTimeout = 60000,
}, ref) => {
  const [code, setCode] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isAutoFillActive, setIsAutoFillActive] = useState(false);

  // Один TextInput для всего ввода
  const hiddenInputRef = useRef<TextInput>(null);

  // Обработчик автозаполнения SMS
  const handleAutoFillCode = useCallback((receivedCode: string) => {
    console.log('Enhanced SMS Input: Получен код через автозаполнение:', receivedCode);

    // Устанавливаем код
    setCode(receivedCode);
    setFocusedIndex(receivedCode.length - 1);

    // Вызываем callbacks
    if (onCodeChange) {
      onCodeChange(receivedCode);
    }

    if (onComplete && receivedCode.length === length) {
      // Небольшая задержка для лучшего UX
      setTimeout(() => onComplete(receivedCode), 200);
    }

    setIsAutoFillActive(false);
  }, [onCodeChange, onComplete, length]);

  // Хук для автозаполнения SMS
  const smsAutoFill = useSimpleSmsAutoFill(
    handleAutoFillCode,
    length
  );

  // Создаем массив цифр
  const digits = Array.from({ length }, (_, index) => code[index] || '');

  // Обработчик изменения кода
  const handleCodeChange = useCallback((newCode: string) => {
    // Фильтруем только цифры
    const filteredCode = newCode.replace(/[^0-9]/g, '').slice(0, length);

    // Определяем, добавили цифру или удалили
    const isAdding = filteredCode.length > code.length;
    const isDeleting = filteredCode.length < code.length;

    setCode(filteredCode);

    // Обновляем фокус
    if (isAdding) {
      setFocusedIndex(Math.min(filteredCode.length, length - 1));
    } else if (isDeleting) {
      setFocusedIndex(filteredCode.length);
    }

    // Вызываем callback
    if (onCodeChange) {
      onCodeChange(filteredCode);
    }

    // Автозавершение
    if (filteredCode.length === length && onComplete) {
      setTimeout(() => onComplete(filteredCode), 100);
    }
  }, [code, length, onCodeChange, onComplete]);

  // Обработчик нажатия клавиш
  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (code.length > 0) {
        const newCode = code.slice(0, -1);
        setCode(newCode);
        setFocusedIndex(newCode.length);

        if (onCodeChange) {
          onCodeChange(newCode);
        }
      }
    }
  }, [code, onCodeChange]);

  // Обработчик нажатия на ячейку
  const handleCellPress = useCallback((index: number) => {
    if (disabled) return;

    setFocusedIndex(Math.min(index, code.length));

    if (!hiddenInputRef.current?.isFocused()) {
      hiddenInputRef.current?.focus();
    }
  }, [disabled, code.length]);

  // Запуск автозаполнения
  const startAutoFill = useCallback(async (): Promise<boolean> => {
    if (!enableAutoFill || Platform.OS !== 'android') {
      return false;
    }

    try {
      setIsAutoFillActive(true);
      const started = await smsAutoFill.startListening();

      if (!started) {
        setIsAutoFillActive(false);

        // Показываем уведомление о необходимости разрешения
        Alert.alert(
          'Автозаполнение SMS',
          'Для автоматического ввода кода из SMS необходимо разрешение на чтение сообщений. Хотите предоставить разрешение?',
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Разрешить',
              onPress: async () => {
                const hasPermission = await smsAutoFill.requestPermission();
                if (hasPermission) {
                  startAutoFill();
                }
              }
            }
          ]
        );
      }

      return started;
    } catch (error) {
      console.error('Enhanced SMS Input: Ошибка при запуске автозаполнения:', error);
      setIsAutoFillActive(false);
      return false;
    }
  }, [enableAutoFill, smsAutoFill]);

  // Остановка автозаполнения
  const stopAutoFill = useCallback(() => {
    smsAutoFill.stopListening();
    setIsAutoFillActive(false);
  }, [smsAutoFill]);

  // Методы для внешнего управления
  useImperativeHandle(ref, () => ({
    focus: () => {
      hiddenInputRef.current?.focus();
    },
    blur: () => {
      hiddenInputRef.current?.blur();
    },
    clear: () => {
      setCode('');
      setFocusedIndex(0);
      if (onCodeChange) {
        onCodeChange('');
      }
    },
    setValue: (newValue: string) => {
      const filteredValue = newValue.replace(/[^0-9]/g, '').slice(0, length);
      setCode(filteredValue);
      setFocusedIndex(Math.min(filteredValue.length, length - 1));
      if (onCodeChange) {
        onCodeChange(filteredValue);
      }
    },
    startAutoFill,
    stopAutoFill,
  }), [length, onCodeChange, startAutoFill, stopAutoFill]);

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && !disabled) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();

        // Автоматически запускаем автозаполнение на Android
        if (enableAutoFill && Platform.OS === 'android') {
          startAutoFill();
        }
      }, 300);
    }
  }, [autoFocus, disabled, enableAutoFill, startAutoFill]);

  // Обновление при изменении внешнего значения
  useEffect(() => {
    if (value !== code) {
      const filteredValue = value.replace(/[^0-9]/g, '').slice(0, length);
      setCode(filteredValue);
      setFocusedIndex(Math.min(filteredValue.length, length - 1));
    }
  }, [value, code, length]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      stopAutoFill();
    };
  }, [stopAutoFill]);

  return (
    <View style={styles.container}>
      {/* Индикатор автозаполнения */}
      {showAutoFillIndicator && isAutoFillActive && Platform.OS === 'android' && (
        <View style={styles.autoFillIndicator}>
          <Text style={styles.autoFillText}>
            Ожидание SMS кода...
          </Text>
        </View>
      )}

      {/* Скрытый TextInput для всего ввода */}
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleCodeChange}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        maxLength={length}
        // Улучшенные атрибуты для автозаполнения
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        // Android-специфичные атрибуты
        {...(Platform.OS === 'android' && {
          importantForAutofill: 'yes',
          autoCompleteType: 'sms-otp',
        })}
        editable={!disabled}
        caretHidden
        contextMenuHidden
        selectTextOnFocus={false}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        blurOnSubmit={false}
        returnKeyType="done"
      />

      {/* Визуальные ячейки */}
      <View style={styles.cellsContainer}>
        {digits.map((digit, index) => (
          <CellComponent
            key={index}
            digit={digit}
            isFocused={index === focusedIndex && !disabled}
            isActive={index < code.length}
            onPress={() => handleCellPress(index)}
            disabled={disabled}
            isAutoFillActive={isAutoFillActive}
          />
        ))}
      </View>
    </View>
  );
});

// Мемоизированный компонент ячейки
const CellComponent = React.memo<{
  digit: string;
  isFocused: boolean;
  isActive: boolean;
  onPress: () => void;
  disabled: boolean;
  isAutoFillActive?: boolean;
}>(({ digit, isFocused, isActive, onPress, disabled, isAutoFillActive }) => {
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Анимация курсора
  useEffect(() => {
    if (isFocused && !digit) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      cursorOpacity.setValue(1);
    }
  }, [isFocused, digit, cursorOpacity]);

  // Анимация пульсации при автозаполнении
  useEffect(() => {
    if (isAutoFillActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isAutoFillActive, pulseAnimation]);

  const cellStyle = [
    styles.cell,
    digit && styles.cellFilled,
    isFocused && styles.cellFocused,
    disabled && styles.cellDisabled,
    isAutoFillActive && styles.cellAutoFill,
  ];

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
      <TouchableOpacity
        style={cellStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        delayPressIn={0}
        delayPressOut={0}
      >
        <View style={styles.cellContent}>
          {digit ? (
            <Text style={[styles.digitText, isFocused && styles.digitTextFocused]}>
              {digit}
            </Text>
          ) : (
            isFocused && (
              <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
            )
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  autoFillIndicator: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#679B00',
  },
  autoFillText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#679B00',
    fontWeight: theme.fonts.weights.medium,
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  cell: {
    width: isSmallScreen ? 42 : 48,
    height: isSmallScreen ? 48 : 56,
    borderWidth: 2,
    borderColor: '#F6F7F9',
    borderRadius: 12,
    backgroundColor: '#F6F7F9',
    marginHorizontal: isSmallScreen ? 2 : 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: '#679B00',
    backgroundColor: '#F0F8FF',
  },
  cellFocused: {
    borderColor: '#679B00',
    borderWidth: 2,
    shadowColor: '#679B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cellDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.disabled,
  },
  cellAutoFill: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  cellContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.lg : theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  digitTextFocused: {
    color: '#679B00',
  },
  cursor: {
    width: 2,
    height: isSmallScreen ? 20 : 24,
    backgroundColor: '#679B00',
    borderRadius: 1,
  },
});

EnhancedSmsInput.displayName = 'EnhancedSmsInput';

export default EnhancedSmsInput;
