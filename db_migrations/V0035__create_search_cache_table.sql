-- Создаём таблицу для кэширования результатов поиска жилья
CREATE TABLE IF NOT EXISTS search_cache (
    id VARCHAR(36) PRIMARY KEY,
    cache_key VARCHAR(500) NOT NULL,
    search_params JSONB NOT NULL,
    search_results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX idx_search_cache_key ON search_cache(cache_key);

-- Индекс для очистки устаревших записей
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);

COMMENT ON TABLE search_cache IS 'Кэш результатов поиска жилья для экономии на API-запросах';
COMMENT ON COLUMN search_cache.cache_key IS 'Хэш параметров поиска (город+даты+гости+цена)';
COMMENT ON COLUMN search_cache.search_params IS 'Оригинальные параметры поиска';
COMMENT ON COLUMN search_cache.search_results IS 'JSON с результатами из API';
COMMENT ON COLUMN search_cache.expires_at IS 'Время истечения кэша (обычно +30 минут)';