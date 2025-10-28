-- Привязываем API интеграцию QQRenta к ассистенту "Менеджер по выбору жилья"
UPDATE assistants 
SET api_integration_id = '4a9b3f88-56dd-4913-ad60-7f495ffafa56'
WHERE id = 'asst_20251028183729';