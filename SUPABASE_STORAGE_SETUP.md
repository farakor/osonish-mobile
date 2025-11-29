# Настройка Supabase Storage для медиа файлов

## Проблема
При попытке загрузки медиа файлов возникает ошибка:
```
[MediaService] Ошибка создания bucket: StorageApiError: new row violates row-level security policy
```

## Решение
Bucket для хранения медиа файлов нужно создать вручную в админ-панели Supabase.

## Инструкция по настройке

### 1. Зайдите в админ-панель Supabase
- Откройте [https://supabase.com](https://supabase.com)
- Войдите в свой аккаунт
- Выберите проект osonish

### 2. Перейдите в раздел Storage
- В левом меню нажмите **Storage**
- Нажмите **Create a new bucket**

### 3. Создайте bucket
**Настройки bucket:**
```
Name: order-media
Public bucket: ✅ Включено
File size limit: 50MB
Allowed MIME types: image/*, video/*
```

### 4. Настройте политики доступа (RLS)
После создания bucket перейдите в **Storage** → **Policies** и создайте следующие политики:

#### Политика для загрузки файлов:
```sql
CREATE POLICY "Пользователи могут загружать файлы" ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-media' AND auth.role() = 'authenticated');
```

#### Политика для чтения файлов:
```sql
CREATE POLICY "Файлы публично доступны для чтения" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-media');
```

### 5. Проверьте настройки
В разделе **Storage** → **Settings** убедитесь что:
- **RLS enabled**: ✅ Включено
- **Public access**: ✅ Включено для чтения

## Проверка работы
После настройки попробуйте создать заказ с медиа файлами. В консоли должно появиться:
```
[MediaService] ✅ Bucket найден
[CreateOrder] ✅ Медиа файлы загружены: X
```

## Структура файлов
Загруженные файлы будут храниться в структуре:
```
order-media/
└── orders/
    ├── 1734567890_0.jpg
    ├── 1734567890_1.mp4
    └── ...
```

## Альтернативное решение (временное)
Если нужно быстро протестировать без настройки Storage, можно временно отключить загрузку медиа, закомментировав вызов mediaService в CreateOrderScreen.tsx. 