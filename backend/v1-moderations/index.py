import json
import os
from typing import Dict, Any
import requests
import psycopg2
import time

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Модерация контента через GPTunnel
    Args: event с httpMethod, body
          context с request_id
    Returns: HTTP response с результатом модерации
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    
    auth_header = event.get('headers', {}).get('authorization', '')
    if not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing or invalid authorization header'}),
            'isBase64Encoded': False
        }
    
    client_api_key = auth_header[7:]
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT active FROM api_keys WHERE key_value = %s', (client_api_key,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid API key'}),
                'isBase64Encoded': False
            }
        
        if not result[0]:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'API key is disabled'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Authentication error: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    gptunnel_api_key = os.environ.get('GPTUNNEL_API_KEY')
    if not gptunnel_api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'GPTunnel API не настроен'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        model = 'text-moderation-latest'
        
        start_time = time.time()
        response = requests.post(
            'https://gptunnel.ru/v1/moderations',
            headers={
                'Authorization': f'Bearer {gptunnel_api_key}',
                'Content-Type': 'application/json'
            },
            json=body_data,
            timeout=30
        )
        latency_ms = int((time.time() - start_time) * 1000)
        
        if database_url:
            try:
                conn = psycopg2.connect(database_url)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO api_requests (endpoint, method, status_code, latency_ms, model)
                    VALUES (%s, %s, %s, %s, %s)
                ''', ('/v1/moderations', 'POST', response.status_code, latency_ms, model))
                
                cursor.execute('''
                    INSERT INTO usage_stats (endpoint, model, request_count)
                    VALUES (%s, %s, 1)
                    ON CONFLICT (endpoint, model, date) 
                    DO UPDATE SET 
                        request_count = usage_stats.request_count + 1,
                        updated_at = CURRENT_TIMESTAMP
                ''', ('/v1/moderations', model))
                
                conn.commit()
                cursor.close()
                conn.close()
            except:
                pass
        
        return {
            'statusCode': response.status_code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': response.text,
            'isBase64Encoded': False
        }
        
    except requests.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка GPTunnel API: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }