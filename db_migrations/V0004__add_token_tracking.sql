-- Добавление полей для отслеживания токенов в api_requests
ALTER TABLE api_requests 
ADD COLUMN tokens_prompt INTEGER DEFAULT 0,
ADD COLUMN tokens_completion INTEGER DEFAULT 0,
ADD COLUMN tokens_total INTEGER DEFAULT 0,
ADD COLUMN model VARCHAR(100);

-- Создание таблицы для агрегированной статистики использования
CREATE TABLE IF NOT EXISTS usage_stats (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_prompt_tokens INTEGER DEFAULT 0,
    total_completion_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(endpoint, model, date)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date);
CREATE INDEX IF NOT EXISTS idx_usage_stats_endpoint ON usage_stats(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);