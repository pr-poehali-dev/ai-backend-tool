-- Таблица для хранения конфигураций внешних API интеграций
CREATE TABLE IF NOT EXISTS api_integrations (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    api_base_url VARCHAR(500) NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    function_description TEXT,
    function_parameters JSONB NOT NULL,
    response_mode VARCHAR(50) DEFAULT 'json',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE api_integrations IS 'Конфигурации внешних API для интеграции с ассистентами';
COMMENT ON COLUMN api_integrations.name IS 'Название интеграции (например: QQRenta Search)';
COMMENT ON COLUMN api_integrations.api_base_url IS 'Базовый URL API (например: https://api2.qqrenta.ru/api/v2/search)';
COMMENT ON COLUMN api_integrations.function_name IS 'Имя функции для GPT function calling';
COMMENT ON COLUMN api_integrations.function_description IS 'Описание функции для GPT';
COMMENT ON COLUMN api_integrations.function_parameters IS 'JSON схема параметров функции';
COMMENT ON COLUMN api_integrations.response_mode IS 'Режим ответа: json (сырые данные) или text (текст от GPT)';