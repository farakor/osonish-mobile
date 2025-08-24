import React, { useState, useRef, useCallback, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { theme } from '../../constants';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface OptimizedSmsInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
}

export interface OptimizedSmsInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
}

const OptimizedSmsInput = forwardRef<OptimizedSmsInputRef, OptimizedSmsInputProps>(({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  autoFocus = true,
  value = '',
}, ref) => {
  const [code, setCode] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Используем один скрытый TextInput для обработки всего ввода
  const hiddenInputRef = useRef<TextInput>(null);

  // Мемоизируем массив цифр для предотвращения лишних ререндеров
  const digits = useMemo(() => {
    const codeArray = code.split('');
    return Array.from({ length }, (_, index) => codeArray[index] || '');
  }, [code, length]);

  // Оптимизированный обработчик изменения кода
  const handleCodeChange = useCallback((newCode: string) => {
    // Фильтруем только цифры и ограничиваем длину
    const filteredCode = newCode.replace(/[^0-9]/g, '').slice(0, length);

    setCode(filteredCode);
    // Фокус должен быть на следующей пустой ячейке или на последней заполненной
    setFocusedIndex(filteredCode.length < length ? filteredCode.length : length - 1);

    // Вызываем callback с задержкой для предотвращения блокировки UI
    if (onCodeChange) {
      requestAnimationFrame(() => onCodeChange(filteredCode));
    }

    // Автоматическое завершение при заполнении всех полей
    if (filteredCode.length === length && onComplete) {
      // Используем setTimeout для асинхронного вызова
      setTimeout(() => onComplete(filteredCode), 0);
    }
  }, [length, onComplete, onCodeChange]);

  // Обработчик нажатия клавиш с оптимизацией
  const handleKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const { key } = e.nativeEvent;

    if (key === 'Backspace') {
      // При Backspace удаляем последний символ
      if (code.length > 0) {
        const newCode = code.slice(0, -1);
        setCode(newCode);
        setFocusedIndex(newCode.length);

        if (onCodeChange) {
          requestAnimationFrame(() => onCodeChange(newCode));
        }
      }
    }
  }, [code, onCodeChange]);

  // Обработчик фокуса на ячейке
  const handleCellPress = useCallback((index: number) => {
    if (disabled) return;

    // Устанавливаем фокус на нажатую ячейку или на первую пустую
    const targetIndex = Math.min(index, code.length);
    setFocusedIndex(targetIndex);
    hiddenInputRef.current?.focus();
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
      handleCodeChange('');
    },
    setValue: (newValue: string) => {
      handleCodeChange(newValue);
    },
  }), [handleCodeChange]);

  // Автофокус при монтировании
  React.useEffect(() => {
    if (autoFocus && !disabled) {
      // Небольшая задержка для корректной работы на всех платформах
      const timer = setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Обновление кода при изменении внешнего значения
  React.useEffect(() => {
    if (value !== code) {
      handleCodeChange(value);
    }
  }, [value, code, handleCodeChange]);

  return (
    <View style={styles.container}>
      {/* Скрытый TextInput для обработки ввода */}
      <TextInput
        ref={hiddenInputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleCodeChange}
        onKeyPress={handleKeyPress}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        editable={!disabled}
        caretHidden
        contextMenuHidden
        selectTextOnFocus={false}
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {/* Визуальные ячейки для отображения кода */}
      <View style={styles.cellsContainer}>
        {digits.map((digit, index) => (
          <CellComponent
            key={index}
            digit={digit}
            isFocused={index === focusedIndex && !disabled}
            isActive={index < code.length}
            onPress={() => handleCellPress(index)}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
});

// Мемоизированный компонент ячейки для предотвращения лишних ререндеров
const CellComponent = React.memo<{
  digit: string;
  isFocused: boolean;
  isActive: boolean;
  onPress: () => void;
  disabled: boolean;
}>(({ digit, isFocused, isActive, onPress, disabled }) => {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Анимация мигания курсора
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

  const cellStyle = [
    styles.cell,
    digit && styles.cellFilled,
    isFocused && styles.cellFocused,
    isActive && styles.cellActive,
    disabled && styles.cellDisabled,
  ];

  return (
    <TouchableOpacity style={cellStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
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
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  cell: {
    width: isSmallScreen ? 42 : 48,
    height: isSmallScreen ? 48 : 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    marginHorizontal: isSmallScreen ? 2 : 4,
    alignItems: 'center',
    justifyContent: 'center',
    // Оптимизация для производительности
    shouldRasterizeIOS: true,
    renderToHardwareTextureAndroid: true,
  },
  cellFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  cellFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  cellActive: {
    // Убираем transform для лучшей производительности
  },
  cellDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.disabled,
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
    // Оптимизация текста
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  digitTextFocused: {
    color: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  cursor: {
    width: 2,
    height: isSmallScreen ? 20 : 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
    // Анимация мигания курсора
    opacity: 1,
  },
});

OptimizedSmsInput.displayName = 'OptimizedSmsInput';

export default OptimizedSmsInput;