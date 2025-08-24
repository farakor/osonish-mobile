import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SimpleSmsInput } from './src/components/common';

export function TestSmsInput() {
  const [code, setCode] = useState('');

  const handleCodeChange = (newCode: string) => {
    console.log('Code changed:', newCode);
    setCode(newCode);
  };

  const handleCodeComplete = (completedCode: string) => {
    console.log('Code completed:', completedCode);
    Alert.alert('Код введен', `Введенный код: ${completedCode}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Тест SMS Input</Text>

      <View style={styles.inputContainer}>
        <SimpleSmsInput
          length={6}
          value={code}
          onCodeChange={handleCodeChange}
          onComplete={handleCodeComplete}
          autoFocus={true}
        />
      </View>

      <Text style={styles.debug}>
        Текущий код: "{code}" (длина: {code.length})
      </Text>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Тестируйте:</Text>
        <Text style={styles.instruction}>• Быстрый ввод цифр</Text>
        <Text style={styles.instruction}>• Удаление с Backspace</Text>
        <Text style={styles.instruction}>• Нажатие на ячейки</Text>
        <Text style={styles.instruction}>• Автозаполнение при 6 цифрах</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  debug: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    fontFamily: 'monospace',
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
