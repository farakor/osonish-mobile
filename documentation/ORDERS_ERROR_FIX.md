# Исправление ошибки получения заказов в osonish-admin

## Проблема
Ошибка: `Ошибка получения заказов: {}` при загрузке страницы заказов в админ панели.

## Причина
Неправильные имена внешних ключей в SQL запросах. В коде использовались автоматически сгенерированные имена (например, `orders_customer_id_fkey`), а в реальной базе данных внешние ключи имеют другие имена (например, `fk_orders_customer_id`).

## Исправления

### 1. Исправлены внешние ключи в файлах:

#### `/src/lib/services/ordersService.ts`
- `orders_customer_id_fkey` → `fk_orders_customer_id`
- `applicants_worker_id_fkey` → `fk_applicants_worker_id`

#### `/src/lib/services/dashboardService.ts`
- `orders_customer_id_fkey` → `fk_orders_customer_id`
- `applicants_order_id_fkey` → `fk_applicants_order_id`

#### `/src/lib/services/analyticsService.ts`
- `orders_customer_id_fkey` → `fk_orders_customer_id`
- `applicants_order_id_fkey` → `fk_applicants_order_id`
- `applicants_worker_id_fkey` → `fk_applicants_worker_id`

### 2. Дополнительное исправление (при необходимости)

Если в базе данных есть заказы со статусом `'active'`, выполните SQL скрипт:

```sql
-- Обновляем статус с 'active' на 'new'
UPDATE orders 
SET status = 'new', 
    updated_at = NOW()
WHERE status = 'active';
```

## Результат
После исправлений админ панель должна корректно загружать и отображать заказы без ошибок.

## Проверка
1. Запустите админ панель: `npm run dev`
2. Перейдите на страницу заказов
3. Убедитесь, что заказы загружаются без ошибок в консоли

## Дата исправления
30 сентября 2025
