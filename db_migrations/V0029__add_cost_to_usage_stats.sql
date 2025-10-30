-- Добавляем колонку для стоимости в таблицу usage_stats
ALTER TABLE usage_stats ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 4) DEFAULT 0;