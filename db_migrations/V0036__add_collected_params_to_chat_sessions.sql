-- Добавляем поле для хранения собранных параметров поиска
ALTER TABLE chat_sessions 
ADD COLUMN collected_params JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN chat_sessions.collected_params IS 'Собранные параметры поиска жилья (city, checkin, nights, guests) до отправки в GPT';