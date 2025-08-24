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

const { height: screenHeight } = Dimensions.get('window');
const isSmallScreen = Platform.OS === 'android' && screenHeight < 1080;

interface SimpleSmsInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
}

export interface SimpleSmsInputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  setValue: (value: string) => void;
}

const SimpleSmsInput = forwardRef<SimpleSmsInputRef, SimpleSmsInputProps>(({
  length = 6,
  onComplete,
  onCodeChange,
  disabled = false,
  autoFocus = true,
  value = '',
}, ref) => {
  const [code, setCode] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Создаем массив цифр
  const digits = Array.from({ length }, (_, index) => code[index] || '');

  // Обработчик изменения в конкретном поле
  const handleDigitChange = useCallback((text: string, index: number) => {
    // Берем только последнюю введенную цифру
    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    // Обновляем код
    const newCode = code.split('');
    newCode[index] = digit;
    const updatedCode = newCode.join('').slice(0, length);

    setCode(updatedCode);

    // Вызываем callback
    if (onCodeChange) {
      onCodeChange(updatedCode);
    }

    // Переходим к следующему полю, если введена цифра
    if (digit && index < length - 1) {
      const nextIndex = index + 1;
      setActiveIndex(nextIndex);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 10);
    }

    // Проверяем завершение ввода
    if (updatedCode.length === length && onComplete) {
      setTimeout(() => onComplete(updatedCode), 100);
    }
  }, [code, length, onCodeChange, onComplete]);

  // Обработчик удаления
  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Если текущее поле пустое, переходим к предыдущему
        const prevIndex = index - 1;
        setActiveIndex(prevIndex);
        setTimeout(() => {
          inputRefs.current[prevIndex]?.focus();
        }, 10);
      } else if (code[index]) {
        // Если в текущем поле есть цифра, удаляем её
        const newCode = code.split('');
        newCode[index] = '';
        const updatedCode = newCode.join('').replace(/\s+$/, ''); // убираем пробелы в конце

        setCode(updatedCode);

        if (onCodeChange) {
          onCodeChange(updatedCode);
        }
      }
    }
  }, [code, onCodeChange]);

  // Обработчик фокуса
  const handleFocus = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Методы для внешнего управления
  useImperativeHandle(ref, () => ({
    focus: () => {
      const focusIndex = Math.min(code.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    blur: () => {
      inputRefs.current[activeIndex]?.blur();
    },
    clear: () => {
      setCode('');
      setActiveIndex(0);
      if (onCodeChange) {
        onCodeChange('');
      }
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 10);
    },
    setValue: (newValue: string) => {
      const filteredValue = newValue.replace(/[^0-9]/g, '').slice(0, length);
      setCode(filteredValue);
      setActiveIndex(Math.min(filteredValue.length, length - 1));
      if (onCodeChange) {
        onCodeChange(filteredValue);
      }
    },
  }), [code, activeIndex, length, onCodeChange]);

  // Автофокус при монтировании
  useEffect(() => {
    if (autoFocus && !disabled) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    }
  }, [autoFocus, disabled]);

  // Обновление при изменении внешнего значения
  useEffect(() => {
    if (value !== code) {
      const filteredValue = value.replace(/[^0-9]/g, '').slice(0, length);
      setCode(filteredValue);
      setActiveIndex(Math.min(filteredValue.length, length - 1));
    }
  }, [value, code, length]);

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {digits.map((digit, index) => (
          <DigitInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            value={digit}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            isFocused={index === activeIndex}
            isActive={index < code.length}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
});

// Компонент отдельной ячейки ввода
const DigitInput = React.forwardRef<TextInput, {
  value: string;
  onChangeText: (text: string) => void;
  onKeyPress: (e: any) => void;
  onFocus: () => void;
  isFocused: boolean;
  isActive: boolean;
  disabled: boolean;
}>(({ value, onChangeText, onKeyPress, onFocus, isFocused, isActive, disabled }, ref) => {
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  // Анимация курсора
  useEffect(() => {
    if (isFocused && !value) {
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
  }, [isFocused, value, cursorOpacity]);

  return (
    <View style={[
      styles.digitContainer,
      value && styles.digitContainerFilled,
      isFocused && styles.digitContainerFocused,
      disabled && styles.digitContainerDisabled,
    ]}>
      <TextInput
        ref={ref}
        style={styles.digitInput}
        value={value}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onFocus={onFocus}
        keyboardType="number-pad"
        maxLength={1}
        textAlign="center"
        selectTextOnFocus
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        editable={!disabled}
        caretHidden={true}
      />

      {/* Отображение цифры или курсора */}
      <View style={styles.digitDisplay} pointerEvents="none">
        {value ? (
          <Text style={[styles.digitText, isFocused && styles.digitTextFocused]}>
            {value}
          </Text>
        ) : (
          isFocused && (
            <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
          )
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
  digitContainer: {
    position: 'relative',
    width: isSmallScreen ? 42 : 48,
    height: isSmallScreen ? 48 : 56,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    marginHorizontal: isSmallScreen ? 2 : 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitContainerFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  digitContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  digitContainerDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.disabled,
  },
  digitInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0, // Скрываем сам TextInput
    fontSize: isSmallScreen ? theme.fonts.sizes.lg : theme.fonts.sizes.xl,
  },
  digitDisplay: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: isSmallScreen ? theme.fonts.sizes.lg : theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  digitTextFocused: {
    color: theme.colors.primary,
  },
  cursor: {
    width: 2,
    height: isSmallScreen ? 20 : 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
});

SimpleSmsInput.displayName = 'SimpleSmsInput';

export default SimpleSmsInput;
