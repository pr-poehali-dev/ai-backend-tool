import json
import os
from typing import Dict, Any
import urllib.request
import urllib.parse
import urllib.error
import psycopg2

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
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
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
                'body': json.dumps({'error': 'GPTunnel API key not configured in secrets'}),
                'isBase64Encoded': False
            }
        
        gptunnel_api_key = result[0]
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to load API key from database: {str(e)}'}),
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
                'body': json.dumps({'error': 'Message is required'}),
                'isBase64Encoded': False
            }
        
        if not assistant_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Assistant ID is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT name, first_message, instructions, model, 
                   context_length, creativity, status, api_integration_id
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
                'body': json.dumps({'error': 'Assistant not found'}),
                'isBase64Encoded': False
            }
        
        assistant_name, first_message, instructions, model, context_length, creativity, status, api_integration_id = assistant
        
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
                'body': json.dumps({'error': 'Assistant is not active'}),
                'isBase64Encoded': False
            }
        
        messages = []
        
        if instructions:
            messages.append({'role': 'system', 'content': instructions})
        
        if len(message_history) > 0:
            messages.extend(message_history[-context_length * 2:])
        
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
        
        gptunnel_payload = {
            'model': model or 'gpt-4o',
            'messages': messages,
            'temperature': float(creativity) if creativity else 0.7
        }
        
        if tools:
            gptunnel_payload['tools'] = tools
            gptunnel_payload['tool_choice'] = 'auto'
        
        request_data = json.dumps(gptunnel_payload).encode('utf-8')
        
        req = urllib.request.Request(
            'https://gptunnel.ru/v1/chat/completions',
            data=request_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {gptunnel_api_key}'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=60) as response:
            response_data = response.read().decode('utf-8')
            bot_response = json.loads(response_data)
            
            message_obj = bot_response.get('choices', [{}])[0].get('message', {})
            tool_calls = message_obj.get('tool_calls', [])
            
            # If model wants to call function
            if tool_calls and api_config:
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
                                
                                # Log first item structure for debugging
                                if results and len(results) > 0:
                                    print(f"First item keys: {results[0].keys() if isinstance(results[0], dict) else 'not a dict'}")
                                    print(f"First item sample: {json.dumps(results[0], ensure_ascii=False)[:500]}")
                                
                                # Return raw JSON data directly
                                return {
                                    'statusCode': 200,
                                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                    'body': json.dumps({'response': results, 'mode': 'json'}),
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
                                    'content': json.dumps(api_data, ensure_ascii=False)
                                })
                                
                                second_payload = {
                                    'model': model or 'gpt-4o',
                                    'messages': messages,
                                    'temperature': float(creativity) if creativity else 0.7
                                }
                                
                                second_request_data = json.dumps(second_payload).encode('utf-8')
                                second_req = urllib.request.Request(
                                    'https://gptunnel.ru/v1/chat/completions',
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
            
            response_text = bot_response.get('choices', [{}])[0].get('message', {}).get('content', 'Нет ответа')
            
            usage = bot_response.get('usage', {})
            tokens_total = usage.get('total_tokens', len(message.split()) + len(response_text.split()))
            tokens_prompt = usage.get('prompt_tokens', len(message.split()))
            tokens_completion = usage.get('completion_tokens', len(response_text.split()))
            model = gptunnel_payload.get('model', 'gpt-4o-mini')
            
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
                ''', ('/gptunnel-bot', model, tokens_total, tokens_prompt, tokens_completion))
                
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
                'body': json.dumps({'response': response_text, 'mode': 'text'}),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
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
            'body': json.dumps({'error': error_message}),
            'isBase64Encoded': False
        }
    
    except urllib.error.URLError as e:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'GPTunnel API unavailable: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }