-- Таблица для хранения истории сообщений с ассистентами
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    assistant_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_messages_assistant_user ON messages(assistant_id, user_id, created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);