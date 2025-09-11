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
} from 'react-native';
import { theme } from '../../constants';
import { useNativeSms } from '../../services/nativeSmsService';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface NativeSmsInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
  /**
   * Включить SMS Retriever API
   */
  enableSmsRetriever?: boolean;
  /**
   * Показывать индикатор автозаполнения
   */
  showAutoFillIndicator?: boolean;
}

export interface NativeSmsInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
  startSmsRetriever: () => Promise<boolean>;
  stopSmsRetriever: () => void;
}

const NativeSmsInput = forwardRef<NativeSmsInputRef, NativeSmsInputProps>(({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  autoFocus = true,
  value = '',
  enableSmsRetriever = true,
  showAutoFillIndicator = true,
}, ref) => {
  const [code, setCode] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isWaitingForSms, setIsWaitingForSms] = useState(false);

  const hiddenInputRef = useRef<TextInput>(null);
  const listenerIdRef = useRef<string>();

  const nativeSms = useNativeSms();

  // Генерируем уникальный ID для слушателя
  useEffect(() => {
    listenerIdRef.current = `native-sms-${Date.now()}-${Math.random()}`;
  }, []);

  // Создаем массив цифр
  const digits = Array.from({ length }, (_, index) => code[index] || '');

  // Обработчик получения SMS кода
  const handleSmsCodeReceived = useCallback((receivedCode: string) => {
    console.log('Native SMS Input: Получен код:', receivedCode);

    setCode(receivedCode);
    setFocusedIndex(receivedCode.length - 1);
    setIsWaitingForSms(false);

    if (onCodeChange) {
      onCodeChange(receivedCode);
    }

    if (onComplete && receivedCode.length === length) {
      setTimeout(() => onComplete(receivedCode), 100);
    }
  }, [onCodeChange, onComplete, length]);

  // Запуск SMS Retriever
  const startSmsRetriever = useCallback(async (): Promise<boolean> => {
    if (!enableSmsRetriever || Platform.OS !== 'android') {
      return false;
    }

    try {
      setIsWaitingForSms(true);

      // Добавляем слушатель
      if (listenerIdRef.current) {
        nativeSms.addListener(listenerIdRef.current, handleSmsCodeReceived);
      }

      // Запускаем SMS Retriever
      const started = await nativeSms.startSmsRetriever({
        timeout: 300000, // 5 минут
      });

      if (!started) {
        setIsWaitingForSms(false);
        if (listenerIdRef.current) {
          nativeSms.removeListener(listenerIdRef.current);
        }
      }

      return started;
    } catch (error) {
      console.error('Native SMS Input: Ошибка запуска SMS Retriever:', error);
      setIsWaitingForSms(false);
      return false;
    }
  }, [enableSmsRetriever, nativeSms, handleSmsCodeReceived]);

  // Остановка SMS Retriever
  const stopSmsRetriever = useCallback(() => {
    setIsWaitingForSms(false);

    if (listenerIdRef.current) {
      nativeSms.removeListener(listenerIdRef.current);
    }

    nativeSms.stopSmsRetriever();
  }, [nativeSms]);

  // Обработчик изменения кода
  const handleCodeChange = useCallback((newCode: string) => {
    const filteredCode = newCode.replace(/[^0-9]/g, '').slice(0, length);

    const isAdding = filteredCode.length > code.length;
    const isDeleting = filteredCode.length < code.length;

    setCode(filteredCode);

    if (isAdding) {
      setFocusedIndex(Math.min(filteredCode.length, length - 1));
    } else if (isDeleting) {
      setFocusedIndex(filteredCode.length);
    }

    if (onCodeChange) {
      onCodeChange(filteredCode);
    }

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
    startSmsRetriever,
    stopSmsRetriever,
  }), [length, onCodeChange, startSmsRetriever, stopSmsRetriever]);

  // Автофокус и запуск SMS Retriever при монтировании
  useEffect(() => {
    if (autoFocus && !disabled) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();

        // Автоматически запускаем SMS Retriever на Android
        if (enableSmsRetriever && Platform.OS === 'android') {
          startSmsRetriever();
        }
      }, 300);
    }
  }, [autoFocus, disabled, enableSmsRetriever, startSmsRetriever]);

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
      stopSmsRetriever();
    };
  }, [stopSmsRetriever]);

  return (
    <View style={styles.container}>
      {/* Индикатор ожидания SMS */}
      {showAutoFillIndicator && isWaitingForSms && Platform.OS === 'android' && (
        <View style={styles.smsIndicator}>
          <Text style={styles.smsIndicatorText}>
            📱 Ожидание SMS кода...
          </Text>
        </View>
      )}

      {/* Скрытый TextInput с правильными Android атрибутами */}
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleCodeChange}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        maxLength={length}
        // iOS атрибуты
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        // Android атрибуты для автозаполнения
        {...(Platform.OS === 'android' && {
          importantForAutofill: 'yes',
          autoCompleteType: 'sms-otp',
          // Дополнительные Android hints
          nativeID: 'sms-code-input',
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
            isWaitingForSms={isWaitingForSms}
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
  isWaitingForSms?: boolean;
}>(({ digit, isFocused, isActive, onPress, disabled, isWaitingForSms }) => {
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

  // Анимация ожидания SMS
  useEffect(() => {
    if (isWaitingForSms) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isWaitingForSms, pulseAnimation]);

  const cellStyle = [
    styles.cell,
    digit && styles.cellFilled,
    isFocused && styles.cellFocused,
    disabled && styles.cellDisabled,
    isWaitingForSms && styles.cellWaiting,
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
  smsIndicator: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  smsIndicatorText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#1976D2',
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
  cellWaiting: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
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

NativeSmsInput.displayName = 'NativeSmsInput';

export default NativeSmsInput;
