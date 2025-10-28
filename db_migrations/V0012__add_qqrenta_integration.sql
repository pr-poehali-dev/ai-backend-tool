-- Добавление конфигурации API Кукурента
INSERT INTO api_integrations (name, description, api_base_url, function_name, function_description, function_parameters, response_mode) 
VALUES (
  'QQRenta Search',
  'Поиск жилья через API Кукурента по городу, дате заезда, количеству ночей и гостей',
  'https://api2.qqrenta.ru/api/v2/search',
  'search_accommodation',
  'Поиск жилья через API Кукурента по городу, дате заезда, количеству ночей и гостей',
  '{"type": "object", "properties": {"city": {"type": "string", "description": "Название города для поиска (например: Москва, Санкт-Петербург, Казань)"}, "checkin": {"type": "string", "description": "Дата заезда в формате YYYY-MM-DD (например: 2025-11-15)"}, "nights": {"type": "integer", "description": "Количество ночей проживания"}, "guests": {"type": "integer", "description": "Количество гостей"}}, "required": ["city", "checkin", "nights", "guests"]}'::jsonb,
  'json'
);