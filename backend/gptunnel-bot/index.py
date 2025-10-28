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
    
    gptunnel_api_key = os.environ.get('GPTUNNEL_API_KEY')
    if not gptunnel_api_key:
        available_keys = list(os.environ.keys())
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'GPTunnel API key not configured',
                'debug': f'Available env vars: {len(available_keys)} keys'
            }),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        message = body_data.get('message', '')
        assistant_id = body_data.get('assistant_id', '')
        user_id = event.get('headers', {}).get('X-User-Id', 'anonymous')
        
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
        
        gptunnel_payload = {
            'message': message,
            'user_id': user_id
        }
        
        request_data = json.dumps(gptunnel_payload).encode('utf-8')
        
        req = urllib.request.Request(
            f'https://gptunnel.ru/api/bot/{assistant_id}',
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
            
            tokens_estimate = len(message.split()) + len(bot_response.get('response', '').split())
            
            database_url = os.environ.get('DATABASE_URL')
            if database_url:
                try:
                    conn = psycopg2.connect(database_url)
                    cursor = conn.cursor()
                    cursor.execute('''
                        INSERT INTO assistant_usage (assistant_id, user_id, message_count, tokens_used)
                        VALUES (%s, %s, %s, %s)
                    ''', (assistant_id, user_id, 1, tokens_estimate))
                    conn.commit()
                    cursor.close()
                    conn.close()
                except:
                    pass
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(bot_response),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        try:
            error_data = json.loads(error_body)
            error_message = error_data.get('error', str(e))
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