-- Убираем API интеграцию у external ассистента (они не поддерживают function calling)
UPDATE t_p5706452_ai_backend_tool.assistants 
SET api_integration_id = NULL,
    instructions = 'Ты умный ИИ ассистент, который помогает пользователям на основе предоставленной информации из баз знаний.',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'asst_20251029093439';