-- Таблица для хранения chat_id сессий с GPTunnel
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    assistant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assistant_id, user_id)
);

CREATE INDEX idx_chat_sessions_assistant_user ON chat_sessions(assistant_id, user_id);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at);