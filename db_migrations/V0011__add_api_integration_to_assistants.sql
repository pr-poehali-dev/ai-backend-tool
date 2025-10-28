-- Добавление связи с API интеграцией в таблицу assistants
ALTER TABLE assistants 
ADD COLUMN api_integration_id VARCHAR(36);

ALTER TABLE assistants
ADD CONSTRAINT fk_api_integration
FOREIGN KEY (api_integration_id) 
REFERENCES api_integrations(id);

COMMENT ON COLUMN assistants.api_integration_id IS 'ID интеграции с внешним API (если используется)';