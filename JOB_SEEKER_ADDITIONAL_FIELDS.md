# Дополнительные поля для Job Seeker

## Обзор изменений

Добавлен новый шаг в процессе регистрации исполнителя типа "Ищу вакансию" (job_seeker) для сбора дополнительной информации:
- **Желаемая зарплата** - числовое поле для указания ожидаемой зарплаты в сумах
- **Готовность к переездам** - флаг (checkbox), указывающий готов ли кандидат рассматривать вакансии в других городах

## Структура шагов регистрации Job Seeker

Теперь процесс регистрации состоит из **5 шагов**:

1. **Образование** - добавление информации об учебных заведениях
2. **Навыки** - выбор профессиональных и личных навыков
3. **Опыт работы** - добавление информации о предыдущих местах работы
4. **Дополнительная информация** ⭐ НОВЫЙ ШАГ
   - Желаемая зарплата (необязательно)
   - Готовность к переездам (checkbox)
5. **Специализация** - выбор желаемых специализаций (обязательный шаг)

## Изменения в коде

### 1. TypeScript интерфейсы (`src/types/index.ts`)

```typescript
export interface User {
  // ... существующие поля
  willingToRelocate?: boolean; // Готов к переездам
  desiredSalary?: number; // Желаемая зарплата
}

export interface RegisterRequest {
  // ... существующие поля
  willingToRelocate?: boolean; // Готов к переездам
  desiredSalary?: number; // Желаемая зарплата
}
```

### 2. Компонент регистрации (`src/screens/auth/JobSeekerInfoStepByStepScreen.tsx`)

**Добавленный state:**
```typescript
const [willingToRelocate, setWillingToRelocate] = useState(false);
const [desiredSalary, setDesiredSalary] = useState('');
const totalSteps = 5; // Увеличено с 4 до 5
```

**Новая функция рендера:**
```typescript
const renderAdditionalInfoStep = () => (
  <ScrollView>
    {/* Поле для ввода желаемой зарплаты */}
    {/* Checkbox для готовности к переездам */}
  </ScrollView>
);
```

**Обновленная логика сохранения:**
```typescript
profileData.willingToRelocate = willingToRelocate;
profileData.desiredSalary = desiredSalary ? parseInt(desiredSalary) : undefined;
```

### 3. База данных (`SQL-30-10/add_job_seeker_additional_fields.sql`)

```sql
-- Добавление новых колонок
ALTER TABLE users
ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS desired_salary INTEGER;

-- Индексы для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_users_willing_to_relocate 
ON users(willing_to_relocate) 
WHERE worker_type = 'job_seeker';

CREATE INDEX IF NOT EXISTS idx_users_desired_salary 
ON users(desired_salary) 
WHERE worker_type = 'job_seeker' AND desired_salary IS NOT NULL;
```

## UI/UX особенности

### Поле "Желаемая зарплата"
- Числовое поле с автоматическим форматированием
- **Форматирование с разделителями тысяч**: `1 000 000`, `100 000`, `10 000`, `1 000`
- Суффикс "сум" отображается справа от поля
- Placeholder: "Например: 5 000 000"
- **Необязательное поле** - можно оставить пустым
- Подсказка: "Можете оставить пустым, если не хотите указывать"
- При вводе автоматически добавляются пробелы между разрядами
- При сохранении пробелы удаляются и значение конвертируется в число

### Checkbox "Готов к переездам"
- Визуальный checkbox с галочкой при активации
- Основной текст: "Готов к переездам"
- Пояснение: "Отметьте, если готовы рассматривать вакансии в других городах"
- По умолчанию: не выбрано (false)

## Автоматическое сохранение данных

Как и в других шагах регистрации, реализовано автоматическое сохранение:
- Данные сохраняются в `profileData` при переходе на следующий шаг
- Не требуется дополнительных действий от пользователя
- Все введенные данные сохраняются в AsyncStorage перед переходом к выбору города

## Применение миграции

Для применения изменений в базе данных выполните:

```bash
psql -U your_username -d your_database -f SQL-30-10/add_job_seeker_additional_fields.sql
```

Или через Supabase SQL Editor:
1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое файла `add_job_seeker_additional_fields.sql`
3. Выполните запрос

## Использование данных

### Фильтрация кандидатов по зарплате
```typescript
// Пример фильтрации кандидатов с желаемой зарплатой до 10 млн сум
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('worker_type', 'job_seeker')
  .lte('desired_salary', 10000000)
  .not('desired_salary', 'is', null);
```

### Фильтрация кандидатов по готовности к переезду
```typescript
// Получение кандидатов, готовых к переезду
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('worker_type', 'job_seeker')
  .eq('willing_to_relocate', true);
```

## Отображение в профиле

Для отображения этих данных в профиле job seeker используйте:

```tsx
{user.desiredSalary && (
  <View>
    <Text>Желаемая зарплата:</Text>
    <Text>{user.desiredSalary.toLocaleString('ru-RU')} сум</Text>
  </View>
)}

{user.willingToRelocate && (
  <View>
    <Text>✓ Готов к переездам</Text>
  </View>
)}
```

## Совместимость

- ✅ Полностью обратно совместимо
- ✅ Существующие пользователи не затронуты
- ✅ Поля опциональные (nullable)
- ✅ Индексы оптимизируют производительность запросов

## Тестирование

### Checklist для тестирования:

- [ ] Регистрация нового job_seeker с указанием зарплаты
- [ ] Регистрация нового job_seeker без указания зарплаты
- [ ] Выбор checkbox "Готов к переездам"
- [ ] Сохранение данных при переходе между шагами
- [ ] Корректное отображение в профиле
- [ ] Фильтрация по желаемой зарплате
- [ ] Фильтрация по готовности к переезду
- [ ] Возврат на предыдущий шаг (данные должны сохраняться)
- [ ] Валидация ввода (только цифры в поле зарплаты)

## Дата добавления

04.11.2025

