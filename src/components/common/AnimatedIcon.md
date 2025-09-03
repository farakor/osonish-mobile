# AnimatedIcon Component

Компонент для отображения анимированных Lottie иконок в приложении.

## Использование

```tsx
import { AnimatedIcon } from '../../components/common';

// Импорт анимации
const MyAnimation = require('../../../assets/my-animation.json');

// Использование компонента
<AnimatedIcon
  source={MyAnimation}
  width={60}
  height={60}
  loop={true}
  autoPlay={true}
  speed={1}
/>
```

## Свойства

| Свойство | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `source` | `any` | - | Источник Lottie анимации (обязательный) |
| `width` | `number` | `60` | Ширина контейнера анимации |
| `height` | `number` | `60` | Высота контейнера анимации |
| `loop` | `boolean` | `true` | Зацикливать ли анимацию |
| `autoPlay` | `boolean` | `true` | Автоматически запускать анимацию |
| `speed` | `number` | `1` | Скорость воспроизведения анимации |
| `style` | `any` | - | Дополнительные стили для контейнера |
| `isSelected` | `boolean` | `false` | Управляет запуском анимации. При `true` анимация начинается |

## Примеры использования

### Базовое использование
```tsx
<AnimatedIcon source={require('./animation.json')} />
```

### С настройками
```tsx
<AnimatedIcon
  source={require('./animation.json')}
  width={80}
  height={80}
  loop={false}
  speed={0.5}
/>
```

### В экране выбора роли (с условной анимацией)
```tsx
<AnimatedIcon
  source={role === 'worker' ? DeliveryManAnimation : OfficeWorkerAnimation}
  width={isSmallScreen ? 60 : 80}
  height={isSmallScreen ? 60 : 80}
  loop={true}
  autoPlay={false}
  speed={0.8}
  isSelected={isSelected}
/>
```

## Примечания

- Компонент использует библиотеку `lottie-react-native`
- Анимации должны быть в формате JSON (экспортированные из After Effects)
- Размеры контейнера влияют на отображение анимации
- Анимация автоматически масштабируется под размер контейнера
