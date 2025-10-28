-- Таблица для внешних API эндпоинтов
CREATE TABLE external_endpoints (
    id TEXT PRIMARY KEY DEFAULT 'ep_' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'POST',
    description TEXT,
    headers JSONB DEFAULT '{}',
    auth_type TEXT DEFAULT 'none',
    auth_config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска активных эндпоинтов
CREATE INDEX idx_external_endpoints_active ON external_endpoints(active);

-- Таблица для логов запросов к внешним API
CREATE TABLE external_endpoint_logs (
    id SERIAL PRIMARY KEY,
    endpoint_id TEXT REFERENCES external_endpoints(id),
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрой выборки логов по эндпоинту
CREATE INDEX idx_external_endpoint_logs_endpoint ON external_endpoint_logs(endpoint_id, created_at DESC);