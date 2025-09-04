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
import { noElevationStyles } from '../../utils/noShadowStyles';

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface StableSmsInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
}

export interface StableSmsInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
}

const StableSmsInput = forwardRef<StableSmsInputRef, StableSmsInputProps>(({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  autoFocus = true,
  value = '',
}, ref) => {
  const [code, setCode] = useState(value);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Один TextInput для всего ввода - НО с правильной логикой
  const hiddenInputRef = useRef<TextInput>(null);

  // Создаем массив цифр
  const digits = Array.from({ length }, (_, index) => code[index] || '');

  // Обработчик изменения кода - СТАБИЛЬНЫЙ
  const handleCodeChange = useCallback((newCode: string) => {
    // Фильтруем только цифры
    const filteredCode = newCode.replace(/[^0-9]/g, '').slice(0, length);

    // Определяем, добавили цифру или удалили
    const isAdding = filteredCode.length > code.length;
    const isDeleting = filteredCode.length < code.length;

    setCode(filteredCode);

    // Обновляем фокус БЕЗ переключения между полями
    if (isAdding) {
      // При добавлении - фокус на следующую позицию
      setFocusedIndex(Math.min(filteredCode.length, length - 1));
    } else if (isDeleting) {
      // При удалении - фокус на текущую позицию
      setFocusedIndex(filteredCode.length);
    }

    // Вызываем callback
    if (onCodeChange) {
      onCodeChange(filteredCode);
    }

    // Автозавершение
    if (filteredCode.length === length && onComplete) {
      // Небольшая задержка для лучшего UX
      setTimeout(() => onComplete(filteredCode), 100);
    }
  }, [code, length, onCodeChange, onComplete]);

  // Обработчик нажатия клавиш - БЕЗ переключения фокуса
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

  // Обработчик нажатия на ячейку - БЕЗ переключения фокуса
  const handleCellPress = useCallback((index: number) => {
    if (disabled) return;

    // Просто обновляем визуальный фокус
    setFocusedIndex(Math.min(index, code.length));

    // Фокусируем скрытое поле ОДИН РАЗ
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
  }), [length, onCodeChange]);

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && !disabled) {
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 300);
    }
  }, [autoFocus, disabled]);

  // Обновление при изменении внешнего значения
  useEffect(() => {
    if (value !== code) {
      const filteredValue = value.replace(/[^0-9]/g, '').slice(0, length);
      setCode(filteredValue);
      setFocusedIndex(Math.min(filteredValue.length, length - 1));
    }
  }, [value, code, length]);

  return (
    <View style={styles.container}>
      {/* ОДИН TextInput для всего ввода - СТАБИЛЬНЫЙ */}
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
        // ВАЖНО: предотвращаем потерю фокуса
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
}>(({ digit, isFocused, isActive, onPress, disabled }) => {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

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

  const cellStyle = [
    styles.cell,
    digit && styles.cellFilled,
    isFocused && styles.cellFocused,
    disabled && styles.cellDisabled,
  ];

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      // Предотвращаем потерю фокуса при нажатии
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

StableSmsInput.displayName = 'StableSmsInput';

export default StableSmsInput;
