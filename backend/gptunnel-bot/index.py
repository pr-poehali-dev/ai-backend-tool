import json
import os
from typing import Dict, Any, Optional
import urllib.request
import urllib.parse
import urllib.error
import psycopg2
import uuid
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
                   context_length, creativity, status, api_integration_id, rag_database_ids
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
        
        assistant_name, first_message, instructions, model, context_length, creativity, status, api_integration_id, rag_database_ids = assistant
        
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
        
        # GPTunnel Bot API формат
        import time
        
        # Добавляем инструкции в текст сообщения если это первое сообщение
        message_text = message
        if instructions and message_count == 0:
            message_text = f"[SYSTEM INSTRUCTION]: {instructions}\n\n[USER MESSAGE]: {message}"
        
        # Bot API использует только базовые поля - настройки модели/RAG в GPTunnel UI
        gptunnel_payload = {
            'event': 'CLIENT_MESSAGE',
            'id': str(uuid.uuid4()),
            'chat_id': chat_id,
            'client_id': user_id,
            'message': {
                'type': 'TEXT',
                'text': message_text,
                'timestamp': int(time.time())
            },
            'agents_online': False
        }
        
        # Выбираем эндпоинт и формат запроса в зависимости от наличия базы знаний
        has_rag_database = rag_database_ids and len(rag_database_ids) > 0
        
        if has_rag_database:
            # Bot API с RAG - используем формат CLIENT_MESSAGE
            endpoint = 'https://gptunnel.ru/api/bot'
            payload = gptunnel_payload
            print(f"[DEBUG] Using Bot API (with RAG): chat_id={chat_id}, databases={rag_database_ids}")
        else:
            # Chat Completions API - используем стандартный OpenAI формат
            endpoint = 'https://gptunnel.ru/v1/chat/completions'
            payload = {
                'model': model or 'gpt-4o-mini',
                'messages': messages,
                'temperature': creativity if creativity is not None else 0.7,
                'stream': False
            }
            if tools:
                payload['tools'] = tools
            print(f"[DEBUG] Using Chat Completions API (no RAG): model={payload['model']}")
        
        print(f"[DEBUG] Sending to GPTunnel: {json_dumps(payload, ensure_ascii=False)[:1000]}")
        
        request_data = json_dumps(payload).encode('utf-8')
        
        # Формируем заголовки в зависимости от API
        headers = {'Content-Type': 'application/json'}
        if has_rag_database:
            headers['Authorization'] = gptunnel_api_key  # Bot API без Bearer
        else:
            headers['Authorization'] = f'Bearer {gptunnel_api_key}'  # Chat Completions с Bearer
        
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
            
            # Обрабатываем ответ в зависимости от типа API
            if has_rag_database:
                # Bot API возвращает BOT_MESSAGE событие с message.text
                event_type = api_response.get('event', '')
                if event_type == 'BOT_MESSAGE' and 'message' in api_response:
                    response_text = api_response['message'].get('text', 'Нет ответа')
                elif 'message' in api_response and 'text' in api_response['message']:
                    response_text = api_response['message']['text']
                else:
                    response_text = 'Нет ответа'
            else:
                # Chat Completions API возвращает стандартный OpenAI формат
                if 'choices' in api_response and len(api_response['choices']) > 0:
                    response_text = api_response['choices'][0]['message']['content']
                else:
                    response_text = 'Нет ответа'
            
            print(f"[DEBUG] Extracted response text: {response_text[:200]}")
            
            # Bot API пока не поддерживает function calling в нашей интеграции
            # TODO: добавить поддержку tool_calls через Bot API если потребуется
            if False and api_config:
                for tool_call in tool_calls:
                    function_name = tool_call.get('function', {}).get('name')
                    function_args = json.loads(tool_call.get('function', {}).get('arguments', '{}'))
                    
                    if function_name == api_config['function_name']:
                        # Build API URL with parameters
                        search_params = urllib.parse.urlencode(function_args)
                        api_url = f"{api_config['api_base_url']}?{search_params}"
                        api_req = urllib.request.Request(api_url, headers={'Accept': 'application/json'})
                        
                        with urllib.request.urlopen(api_req, timeout=30) as api_response:
                            api_data = json.loads(api_response.read().decode('utf-8'))
                            
                            # Check response mode
                            if api_config.get('response_mode') == 'json':
                                # Extract results array from response if it exists
                                results = api_data.get('results', []) if isinstance(api_data, dict) else api_data
                                
                                # Limit to 10 items
                                results = results[:10] if isinstance(results, list) else results
                                
                                # Return raw JSON data directly
                                return {
                                    'statusCode': 200,
                                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                    'body': json_dumps({'response': results, 'mode': 'json'}),
                                    'isBase64Encoded': False
                                }
                            else:
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
            
            # Для Bot API нет usage метрики от GPTunnel, примерно считаем
            usage = bot_response.get('usage', {})
            tokens_total = usage.get('total_tokens', len(message.split()) + len(response_text.split()))
            tokens_prompt = usage.get('prompt_tokens', len(message.split()))
            tokens_completion = usage.get('completion_tokens', len(response_text.split()))
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