-- Добавление параметра max_price в API интеграцию для фильтрации по цене
UPDATE t_p5706452_ai_backend_tool.api_integrations 
SET function_parameters = '{
  "type": "object",
  "required": ["city", "checkin", "nights", "guests"],
  "properties": {
    "city": {
      "type": "string",
      "description": "Название города для поиска (например: Москва, Санкт-Петербург, Казань)"
    },
    "guests": {
      "type": "integer",
      "description": "Количество гостей"
    },
    "nights": {
      "type": "integer",
      "description": "Количество ночей проживания"
    },
    "checkin": {
      "type": "string",
      "description": "Дата заезда в формате YYYY-MM-DD (например: 2025-11-15)"
    },
    "max_price": {
      "type": "integer",
      "description": "Максимальная цена за ночь в рублях (опционально). Используй если пользователь указал бюджет или максимальную стоимость"
    }
  }
}'::jsonb,
function_description = 'Поиск жилья через API Кукурента по городу, дате заезда, количеству ночей, гостей и максимальной цене',
updated_at = CURRENT_TIMESTAMP
WHERE id = '4a9b3f88-56dd-4913-ad60-7f495ffafa56';