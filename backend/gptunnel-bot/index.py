import json
import os
from typing import Dict, Any, Optional
import urllib.request
import urllib.parse
import urllib.error
import psycopg2
import uuid
import time
from datetime import datetime
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def json_dumps(data, **kwargs):
    kwargs['cls'] = DecimalEncoder
    return json.dumps(data, **kwargs)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проксирование запросов к GPTunnel Bot API
    Args: event с httpMethod, body с message и assistant_id
          context с request_id
    Returns: HTTP response с ответом от бота
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute("SELECT secret_value FROM secrets WHERE secret_name = 'GPTUNNEL_API_KEY' LIMIT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result or not result[0]:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'error': 'GPTunnel API key not configured in secrets'}),
                'isBase64Encoded': False
            }
        
        gptunnel_api_key = result[0]
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': f'Failed to load API key from database: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        message = body_data.get('message', '')
        assistant_id = body_data.get('assistant_id', '')
        user_id = event.get('headers', {}).get('X-User-Id', 'anonymous')
        message_history = body_data.get('history', [])
        
        if not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        if not assistant_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'error': 'Assistant ID is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT name, first_message, instructions, model, 
                   context_length, creativity, status, api_integration_id, assistant_code, type
            FROM assistants 
            WHERE id = %s
        ''', (assistant_id,))
        assistant = cursor.fetchone()
        
        if not assistant:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'error': 'Assistant not found'}),
                'isBase64Encoded': False
            }
        
        assistant_name, first_message, instructions, model, context_length, creativity, status, api_integration_id, assistant_code, assistant_type = assistant
        
        # Получаем или создаём chat_id для сессии с GPTunnel
        cursor.execute('''
            SELECT chat_id, message_count FROM chat_sessions
            WHERE assistant_id = %s AND user_id = %s
        ''', (assistant_id, user_id))
        session = cursor.fetchone()
        
        chat_id: Optional[str] = None
        message_count = 0
        
        if session:
            chat_id = session[0]
            message_count = session[1]
            
            # Если достигнут лимит сообщений (context_length * 2 для пары запрос-ответ)
            # или прошло больше 20 сообщений (лимит GPTunnel), создаём новую сессию
            if message_count >= min(context_length * 2, 20):
                chat_id = str(uuid.uuid4())
                message_count = 0
                cursor.execute('''
                    UPDATE chat_sessions 
                    SET chat_id = %s, message_count = 0, updated_at = CURRENT_TIMESTAMP
                    WHERE assistant_id = %s AND user_id = %s
                ''', (chat_id, assistant_id, user_id))
                conn.commit()
                print(f"[DEBUG] Created new chat session: {chat_id}")
            else:
                # Обновляем счётчик сообщений
                cursor.execute('''
                    UPDATE chat_sessions 
                    SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP
                    WHERE assistant_id = %s AND user_id = %s
                ''', (assistant_id, user_id))
                conn.commit()
        else:
            # Создаём новую сессию
            chat_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO chat_sessions (id, assistant_id, user_id, chat_id, message_count)
                VALUES (%s, %s, %s, %s, 2)
            ''', (str(uuid.uuid4()), assistant_id, user_id, chat_id))
            conn.commit()
            print(f"[DEBUG] Created first chat session: {chat_id}")
        
        # Load API integration config if exists
        api_config = None
        if api_integration_id:
            cursor.execute('''
                SELECT name, api_base_url, function_name, function_description, 
                       function_parameters, response_mode
                FROM api_integrations
                WHERE id = %s
            ''', (api_integration_id,))
            api_data = cursor.fetchone()
            if api_data:
                api_config = {
                    'name': api_data[0],
                    'api_base_url': api_data[1],
                    'function_name': api_data[2],
                    'function_description': api_data[3],
                    'function_parameters': api_data[4],
                    'response_mode': api_data[5]
                }
        
        cursor.close()
        conn.close()
        
        if status != 'active':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'error': 'Assistant is not active'}),
                'isBase64Encoded': False
            }
        
        messages = []
        
        if instructions:
            messages.append({'role': 'system', 'content': instructions})
        
        if len(message_history) > 0:
            # Нормализуем сообщения из истории - content должен быть строкой
            for msg in message_history[-context_length * 2:]:
                content = msg.get('content', '')
                # Если content - массив/объект, конвертируем в строку
                if isinstance(content, (list, dict)):
                    content = json_dumps(content, ensure_ascii=False)
                messages.append({
                    'role': msg.get('role', 'user'),
                    'content': content
                })
        
        messages.append({'role': 'user', 'content': message})
        
        # Define tools for function calling from API integration config
        tools = None
        if api_config:
            tools = [{
                'type': 'function',
                'function': {
                    'name': api_config['function_name'],
                    'description': api_config['function_description'],
                    'parameters': api_config['function_parameters']
                }
            }]
        
        # Выбираем эндпоинт по ТИПУ ассистента (а не по наличию RAG базы)
        import time
        
        if assistant_type == 'external':
            # Тип "external" → используем /v1/assistant/chat с assistantCode
            if not assistant_code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json_dumps({
                        'error': 'assistant_code not configured',
                        'message': 'Для внешнего ассистента необходимо указать ID ассистента из GPTunnel UI'
                    }),
                    'isBase64Encoded': False
                }
            
            endpoint = 'https://gptunnel.ru/v1/assistant/chat'
            payload = {
                'chatId': chat_id,
                'assistantCode': assistant_code,
                'message': message,
                'maxContext': context_length if context_length else 10
            }
            print(f"[DEBUG] Using Assistant Chat API (external): chatId={chat_id}, assistantCode={assistant_code}, maxContext={payload['maxContext']}")
            print(f"[DEBUG] Payload: {json_dumps(payload, ensure_ascii=False)}")
        else:
            # Тип "simple" → используем /v1/chat/completions (даже если есть RAG база)
            endpoint = 'https://gptunnel.ru/v1/chat/completions'
            payload = {
                'model': model or 'gpt-4o-mini',
                'messages': messages,
                'temperature': creativity if creativity is not None else 0.7,
                'stream': False
            }
            if tools:
                payload['tools'] = tools
                print(f"[DEBUG] Using Chat Completions API with tools: model={payload['model']}")
            else:
                print(f"[DEBUG] Using Chat Completions API: model={payload['model']}")
        
        print(f"[DEBUG] Sending to GPTunnel: {json_dumps(payload, ensure_ascii=False)[:1000]}")
        
        request_data = json_dumps(payload).encode('utf-8')
        
        # Формируем заголовки - всегда используем Bearer токен
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {gptunnel_api_key}'
        }
        
        req = urllib.request.Request(
            endpoint,
            data=request_data,
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            response_data = response.read().decode('utf-8')
            api_response = json.loads(response_data)
            
            print(f"[DEBUG] GPTunnel API response: {response_data[:1000]}")
            
            # External Assistant API возвращает прямой объект с полем 'message'
            if assistant_type == 'external' and 'message' in api_response:
                response_text = api_response.get('message', 'Нет ответа')
                tool_calls = []
                print(f"[DEBUG] Extracted response from external assistant: {response_text[:200]}")
            # Simple Assistant API (Chat Completions) возвращает OpenAI формат с 'choices'
            elif 'choices' in api_response and len(api_response['choices']) > 0:
                message_obj = api_response['choices'][0]['message']
                response_text = message_obj.get('content')
                tool_calls = message_obj.get('tool_calls', [])
                
                # Если есть tool_calls - обработаем их
                if tool_calls and api_config:
                    print(f"[DEBUG] Processing {len(tool_calls)} tool calls")
                elif not response_text:
                    response_text = 'Нет ответа'
                
                print(f"[DEBUG] Extracted response text: {response_text[:200] if response_text else 'None'}")
            else:
                response_text = 'Нет ответа'
                tool_calls = []
                print(f"[DEBUG] Unknown response format: {list(api_response.keys())}")
            
            # Обработка tool_calls для вызова внешних API
            if tool_calls and api_config:
                print(f"[DEBUG] tool_calls detected: {len(tool_calls)} calls")
                print(f"[DEBUG] API config: {api_config['function_name']}, base_url={api_config['api_base_url']}, response_mode={api_config.get('response_mode')}")
                
                for tool_call in tool_calls:
                    function_name = tool_call.get('function', {}).get('name')
                    function_args = json.loads(tool_call.get('function', {}).get('arguments', '{}'))
                    
                    print(f"[DEBUG] Tool call: function={function_name}, args={json_dumps(function_args)}")
                    
                    if function_name == api_config['function_name']:
                        # Validate required parameters
                        required_params = ['city', 'checkin', 'nights', 'guests']
                        missing_params = [p for p in required_params if not function_args.get(p)]
                        
                        if missing_params:
                            error_msg = f"Не хватает обязательных параметров: {', '.join(missing_params)}. Пожалуйста, укажите город, дату заезда, количество ночей и количество гостей."
                            print(f"[DEBUG] Missing required params: {missing_params}")
                            return {
                                'statusCode': 400,
                                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                'body': json_dumps({'error': error_msg}),
                                'isBase64Encoded': False
                            }
                        
                        # Extract max_price for client-side filtering
                        max_price = function_args.pop('max_price', None)
                        
                        # Build API URL with parameters (without max_price)
                        search_params = urllib.parse.urlencode(function_args)
                        api_url = f"{api_config['api_base_url']}?{search_params}"
                        
                        print(f"[DEBUG] Calling external API: {api_url}")
                        if max_price:
                            print(f"[DEBUG] Client-side filter: max_price={max_price}")
                        
                        # Retry logic with exponential backoff
                        max_retries = 3
                        retry_delay = 1
                        api_data = None
                        last_error = None
                        
                        for attempt in range(max_retries):
                            try:
                                api_req = urllib.request.Request(api_url, headers={'Accept': 'application/json'})
                                
                                with urllib.request.urlopen(api_req, timeout=30) as api_response:
                                    api_response_text = api_response.read().decode('utf-8')
                                    api_data = json.loads(api_response_text)
                                    break
                                    
                            except (urllib.error.URLError, urllib.error.HTTPError, ConnectionResetError) as e:
                                last_error = e
                                print(f"[DEBUG] Attempt {attempt + 1}/{max_retries} failed: {str(e)}")
                                
                                if attempt < max_retries - 1:
                                    print(f"[DEBUG] Retrying in {retry_delay} seconds...")
                                    time.sleep(retry_delay)
                                    retry_delay *= 2
                                else:
                                    print(f"[DEBUG] All retry attempts exhausted")
                                    return {
                                        'statusCode': 503,
                                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                        'body': json_dumps({'error': f'External API unavailable: {str(last_error)}'}),
                                        'isBase64Encoded': False
                                    }
                        
                        if api_data is None:
                            return {
                                'statusCode': 503,
                                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                'body': json_dumps({'error': 'External API returned no data'}),
                                'isBase64Encoded': False
                            }
                            
                            print(f"[DEBUG] External API response (first 500 chars): {api_response_text[:500]}")
                            print(f"[DEBUG] API response keys: {list(api_data.keys()) if isinstance(api_data, dict) else 'list'}")
                            
                            # Check response mode
                            if api_config.get('response_mode') == 'json':
                                print(f"[DEBUG] Response mode is 'json' - returning raw JSON to frontend")
                                
                                # Extract results array from response if it exists
                                results = api_data.get('results', []) if isinstance(api_data, dict) else api_data
                                
                                print(f"[DEBUG] Extracted results: {len(results) if isinstance(results, list) else 'not a list'}")
                                
                                # Filter by max_price if specified
                                if max_price and isinstance(results, list):
                                    results = [r for r in results if r.get('price', 0) <= max_price]
                                    print(f"[DEBUG] After price filter (<={max_price}): {len(results)} items")
                                
                                # Limit to 10 items
                                results = results[:10] if isinstance(results, list) else results
                                
                                print(f"[DEBUG] Returning to frontend: {len(results) if isinstance(results, list) else 1} items")
                                
                                # Return raw JSON data directly
                                return {
                                    'statusCode': 200,
                                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                    'body': json_dumps({'response': results, 'mode': 'json'}),
                                    'isBase64Encoded': False
                                }
                            else:
                                print(f"[DEBUG] Response mode is 'text' - sending API data to GPT for processing")
                                
                                # Continue with GPT processing (text mode)
                                messages.append({
                                    'role': 'assistant',
                                    'content': message_obj.get('content'),
                                    'tool_calls': tool_calls
                                })
                                
                                messages.append({
                                    'role': 'tool',
                                    'tool_call_id': tool_call.get('id'),
                                    'content': json_dumps(api_data, ensure_ascii=False)
                                })
                                
                                print(f"[DEBUG] Prepared messages for second GPT call (with API data)")
                                
                                second_payload = {
                                    'model': model or 'gpt-4o',
                                    'messages': messages,
                                    'temperature': float(creativity) if creativity else 0.7
                                }
                                
                                # Добавляем RAG базы для второго запроса
                                if rag_database_ids and len(rag_database_ids) > 0:
                                    second_payload['databaseIds'] = rag_database_ids
                                    second_payload['database_ids'] = rag_database_ids
                                    second_payload['databases'] = rag_database_ids
                                
                                second_request_data = json_dumps(second_payload).encode('utf-8')
                                
                                print(f"[DEBUG] Sending second request to GPTunnel with API data")
                                print(f"[DEBUG] Second payload (first 500 chars): {json_dumps(second_payload, ensure_ascii=False)[:500]}")
                                
                                # Для второго запроса используем тот же endpoint
                                second_req = urllib.request.Request(
                                    endpoint,
                                    data=second_request_data,
                                    headers={
                                        'Content-Type': 'application/json',
                                        'Authorization': f'Bearer {gptunnel_api_key}'
                                    },
                                    method='POST'
                                )
                                
                                with urllib.request.urlopen(second_req, timeout=60) as second_response:
                                    second_response_data = second_response.read().decode('utf-8')
                                    bot_response = json.loads(second_response_data)
                                    
                                    print(f"[DEBUG] Second GPT response (first 500 chars): {second_response_data[:500]}")
                                    
                                    # Extract final response from second GPT call
                                    if 'choices' in bot_response and len(bot_response['choices']) > 0:
                                        response_text = bot_response['choices'][0]['message'].get('content', 'Нет ответа')
                                        print(f"[DEBUG] Final response text from GPT: {response_text[:200]}")
                                    else:
                                        response_text = 'Нет ответа от GPT после вызова API'
                                        print(f"[DEBUG] No valid response from second GPT call")
                                    
                                    print(f"[DEBUG] Final response after tool call: {response_text[:200]}")
            
            # Извлекаем метрики использования токенов
            if assistant_type == 'external':
                # External API возвращает usage и spendTokenCount
                usage = api_response.get('usage', {})
                tokens_total = api_response.get('spendTokenCount') or usage.get('total_tokens', 0)
                tokens_prompt = usage.get('prompt_tokens', 0)
                tokens_completion = usage.get('completion_tokens', 0)
                model_name = api_response.get('model') or model or 'unknown'
            else:
                # Simple API возвращает стандартный OpenAI формат
                usage = api_response.get('usage', {})
                tokens_total = usage.get('total_tokens', len(message.split()) + len(response_text.split() if response_text else []))
                tokens_prompt = usage.get('prompt_tokens', len(message.split()))
                tokens_completion = usage.get('completion_tokens', len(response_text.split() if response_text else []))
                model_name = model or 'gpt-4o'
            
            try:
                conn = psycopg2.connect(database_url)
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO assistant_usage (assistant_id, user_id, message_count, tokens_used)
                    VALUES (%s, %s, %s, %s)
                ''', (assistant_id, user_id, 1, tokens_total))
                
                cursor.execute('''
                    INSERT INTO usage_stats (endpoint, model, request_count, total_tokens, total_prompt_tokens, total_completion_tokens)
                    VALUES (%s, %s, 1, %s, %s, %s)
                    ON CONFLICT (endpoint, model, date) 
                    DO UPDATE SET 
                        request_count = usage_stats.request_count + 1,
                        total_tokens = usage_stats.total_tokens + EXCLUDED.total_tokens,
                        total_prompt_tokens = usage_stats.total_prompt_tokens + EXCLUDED.total_prompt_tokens,
                        total_completion_tokens = usage_stats.total_completion_tokens + EXCLUDED.total_completion_tokens,
                        updated_at = CURRENT_TIMESTAMP
                ''', ('/gptunnel-bot', model_name, tokens_total, tokens_prompt, tokens_completion))
                
                cursor.execute('''
                    INSERT INTO messages (assistant_id, user_id, role, content, tokens_used)
                    VALUES (%s, %s, 'user', %s, %s)
                ''', (assistant_id, user_id, message, tokens_prompt))
                
                cursor.execute('''
                    INSERT INTO messages (assistant_id, user_id, role, content, tokens_used)
                    VALUES (%s, %s, 'assistant', %s, %s)
                ''', (assistant_id, user_id, response_text, tokens_completion))
                
                conn.commit()
                cursor.close()
                conn.close()
            except:
                pass
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json_dumps({'response': response_text, 'mode': 'text'}),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"[ERROR] GPTunnel API returned {e.code}: {error_body[:500]}")
        try:
            error_data = json.loads(error_body)
            error_obj = error_data.get('error', str(e))
            # If error is object with message, extract message
            if isinstance(error_obj, dict):
                error_message = error_obj.get('message', str(error_obj))
            else:
                error_message = str(error_obj)
        except:
            error_message = str(e)
        
        return {
            'statusCode': e.code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': error_message, 'details': error_body[:500]}),
            'isBase64Encoded': False
        }
    
    except urllib.error.URLError as e:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': f'GPTunnel API unavailable: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json_dumps({'error': str(e)}),
            'isBase64Encoded': False
        }