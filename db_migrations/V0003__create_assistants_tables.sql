CREATE TABLE IF NOT EXISTS assistants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_message TEXT,
    instructions TEXT,
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o',
    context_length INTEGER DEFAULT 5,
    human_emulation INTEGER DEFAULT 5,
    creativity DECIMAL(3,2) DEFAULT 0.7,
    voice_recognition BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_usage (
    id SERIAL PRIMARY KEY,
    assistant_id VARCHAR(50),
    user_id VARCHAR(100) NOT NULL,
    message_count INTEGER DEFAULT 1,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assistant_usage_assistant_id ON assistant_usage(assistant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_created_at ON assistant_usage(created_at);

INSERT INTO assistants (id, name, first_message, instructions, model, context_length, human_emulation, creativity, voice_recognition, status)
VALUES 
('asst_001', 'Главный ассистент', 'Здравствуйте! Я главный ИИ-ассистент. Чем могу помочь?', 'Отвечать профессионально и подробно на все вопросы пользователей.', 'gpt-4o', 7, 8, 0.7, true, 'active'),
('asst_002', 'Служба поддержки', 'Привет! Я ассистент службы поддержки. Опишите вашу проблему.', 'Помогать решать технические проблемы пользователей.', 'gpt-3.5-turbo', 5, 6, 0.5, false, 'active')
ON CONFLICT (id) DO NOTHING;
