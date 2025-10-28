-- Переносим GPTUNNEL_API_KEY из settings в secrets
INSERT INTO secrets (secret_name, secret_value)
SELECT key_name, key_value
FROM settings
WHERE key_name = 'GPTUNNEL_API_KEY'
ON CONFLICT DO NOTHING;