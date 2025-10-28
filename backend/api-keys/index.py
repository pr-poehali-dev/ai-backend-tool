import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление API ключами - получение, создание, обновление статуса
    Args: event с httpMethod, body, queryStringParameters
          context с request_id
    Returns: HTTP response с JSON данными
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
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cursor.execute('''
                SELECT id, name, key_prefix as key, 
                       TO_CHAR(created_at, 'YYYY-MM-DD') as created,
                       active, requests_count as requests
                FROM api_keys
                ORDER BY created_at DESC
            ''')
            keys = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(row) for row in keys]),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', f'New API Key')
            
            import random
            import string
            import hashlib
            
            # Generate full key: sk_live_<32 random chars>
            full_key = 'sk_live_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=32))
            
            # Create hash for database storage
            key_hash = hashlib.sha256(full_key.encode()).hexdigest()
            
            # Create prefix for display: sk_live_...last7
            key_prefix = f'sk_live_...{full_key[-7:]}'
            
            # Store only hash and prefix in DB (never store full key)
            cursor.execute('''
                INSERT INTO api_keys (name, key_hash, key_prefix, active, requests_count)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, 
                          TO_CHAR(created_at, 'YYYY-MM-DD') as created,
                          active, requests_count as requests
            ''', (name, key_hash, key_prefix, True, 0))
            
            row = cursor.fetchone()
            conn.commit()
            
            # Build response with only selected fields + full key
            response_data = {
                'id': row['id'],
                'name': row['name'],
                'created': row['created'],
                'active': row['active'],
                'requests': row['requests'],
                'key': full_key  # Full key returned ONLY on creation
            }
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(response_data),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            key_id = body.get('id')
            active = body.get('active')
            name = body.get('name')
            
            if key_id is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing id field'}),
                    'isBase64Encoded': False
                }
            
            if active is not None:
                cursor.execute('''
                    UPDATE api_keys 
                    SET active = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, name, key_prefix as key, 
                              TO_CHAR(created_at, 'YYYY-MM-DD') as created,
                              active, requests_count as requests
                ''', (active, key_id))
            elif name is not None:
                cursor.execute('''
                    UPDATE api_keys 
                    SET name = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, name, key_prefix as key, 
                              TO_CHAR(created_at, 'YYYY-MM-DD') as created,
                              active, requests_count as requests
                ''', (name, key_id))
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing active or name field'}),
                    'isBase64Encoded': False
                }
            
            updated_key = cursor.fetchone()
            conn.commit()
            
            if not updated_key:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Key not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(updated_key)),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            key_id = params.get('id')
            
            if not key_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing id parameter'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('DELETE FROM api_keys WHERE id = %s RETURNING id', (key_id,))
            deleted_key = cursor.fetchone()
            conn.commit()
            
            if not deleted_key:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Key not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': deleted_key['id']}),
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
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()