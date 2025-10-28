import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление настройками GPTunnel API - сохранение и проверка ключа
    Args: event с httpMethod, body
          context с request_id
    Returns: HTTP response с результатом проверки
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
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
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cursor.execute("SELECT key_value FROM settings WHERE key_name = 'GPTUNNEL_API_KEY' LIMIT 1")
            result = cursor.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'connected': result is not None}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            api_key = body.get('apiKey', '').strip()
            
            if not api_key:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'API ключ не указан'}),
                    'isBase64Encoded': False
                }
            
            # Проверка ключа через GPTunnel API
            try:
                response = requests.get(
                    'https://gptunnel.ru/v1/models',
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=10
                )
                
                if response.status_code != 200:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': f'Неверный API ключ (код {response.status_code})'}),
                        'isBase64Encoded': False
                    }
            except requests.RequestException as e:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': f'Ошибка проверки ключа: {str(e)}'}),
                    'isBase64Encoded': False
                }
            
            # Сохранение ключа в БД
            cursor.execute('''
                INSERT INTO settings (key_name, key_value)
                VALUES ('GPTUNNEL_API_KEY', %s)
                ON CONFLICT (key_name) 
                DO UPDATE SET key_value = EXCLUDED.key_value, updated_at = CURRENT_TIMESTAMP
            ''', (api_key,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cursor.close()
        conn.close()
