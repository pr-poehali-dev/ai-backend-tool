import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление секретами проекта (чтение, добавление, обновление)
    Args: event с httpMethod, body с name и value
          context с request_id
    Returns: HTTP response с результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action', '')
            
            if action == 'balance':
                cursor.execute("SELECT secret_value FROM secrets WHERE secret_name = 'GPTUNNEL_API_KEY' LIMIT 1")
                result = cursor.fetchone()
                
                if not result or not result['secret_value']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'GPTUNNEL_API_KEY not found'}),
                        'isBase64Encoded': False
                    }
                
                api_key = result['secret_value']
                
                try:
                    response = requests.get(
                        'https://gptunnel.ru/v1/balance',
                        headers={'Authorization': f'Bearer {api_key}'},
                        timeout=30
                    )
                    
                    if response.status_code != 200:
                        return {
                            'statusCode': response.status_code,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': f'GPTunnel API error: {response.status_code}'}),
                            'isBase64Encoded': False
                        }
                    
                    balance_data = response.json()
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'balance': balance_data.get('balance', 0)}),
                        'isBase64Encoded': False
                    }
                except requests.RequestException as e:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Request failed: {str(e)}'}),
                        'isBase64Encoded': False
                    }
            
            cursor.execute("SELECT secret_name, created_at, updated_at FROM secrets ORDER BY secret_name")
            secrets = cursor.fetchall()
            
            result = []
            for secret in secrets:
                result.append({
                    'name': secret['secret_name'],
                    'has_value': True,
                    'created_at': secret['created_at'].isoformat() if secret['created_at'] else None,
                    'updated_at': secret['updated_at'].isoformat() if secret['updated_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '').strip()
            value = body.get('value', '').strip()
            
            if not name or not value:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя и значение обязательны'}),
                    'isBase64Encoded': False
                }
            
            should_validate = name == 'GPTUNNEL_API_KEY'
            
            if should_validate:
                try:
                    response = requests.get(
                        'https://gptunnel.ru/v1/models',
                        headers={'Authorization': f'Bearer {value}'},
                        timeout=10
                    )
                    
                    if response.status_code != 200:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': f'Неверный API ключ (код {response.status_code})'}),
                            'isBase64Encoded': False
                        }
                except requests.RequestException as e:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Ошибка проверки ключа: {str(e)}'}),
                        'isBase64Encoded': False
                    }
            
            cursor.execute('''
                INSERT INTO secrets (secret_name, secret_value)
                VALUES (%s, %s)
                ON CONFLICT (secret_name) 
                DO UPDATE SET secret_value = EXCLUDED.secret_value, updated_at = CURRENT_TIMESTAMP
                RETURNING secret_name, created_at, updated_at
            ''', (name, value))
            conn.commit()
            
            result = cursor.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'name': result['secret_name'],
                    'created_at': result['created_at'].isoformat() if result['created_at'] else None,
                    'updated_at': result['updated_at'].isoformat() if result['updated_at'] else None
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            name = query_params.get('name', '').strip()
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя секрета обязательно'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('DELETE FROM secrets WHERE secret_name = %s', (name,))
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