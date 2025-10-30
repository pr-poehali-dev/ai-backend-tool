-- Обновляем модель для ассистентов бронирования жилья с GPT-4o на GPT-4o-mini
UPDATE assistants 
SET model = 'gpt-4o-mini', 
    updated_at = CURRENT_TIMESTAMP
WHERE id IN ('asst_20251029093439', 'asst_20251028183729');