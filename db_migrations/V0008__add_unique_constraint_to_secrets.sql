-- Добавляем уникальное ограничение на secret_name
ALTER TABLE secrets ADD CONSTRAINT secrets_secret_name_unique UNIQUE (secret_name);