import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage chat widgets (CRUD operations)
    Args: event with httpMethod, body, pathParams
    Returns: HTTP response with chat data
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
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cur.execute('SELECT id, name, config, code, created_at FROM chats ORDER BY created_at DESC')
            chats = cur.fetchall()
            
            result = []
            for chat in chats:
                result.append({
                    'id': chat['id'],
                    'name': chat['name'],
                    'config': chat['config'],
                    'code': chat['code'],
                    'created_at': chat['created_at'].isoformat() if chat['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result)
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('id')
            name = body_data.get('name')
            config = body_data.get('config')
            code = body_data.get('code')
            
            if not all([chat_id, name, config, code]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'})
                }
            
            cur.execute(
                'INSERT INTO chats (id, name, config, code) VALUES (%s, %s, %s, %s) RETURNING id, name, config, code, created_at',
                (chat_id, name, json.dumps(config), code)
            )
            conn.commit()
            
            chat = cur.fetchone()
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': chat['id'],
                    'name': chat['name'],
                    'config': chat['config'],
                    'code': chat['code'],
                    'created_at': chat['created_at'].isoformat()
                })
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('id')
            name = body_data.get('name')
            config = body_data.get('config')
            code = body_data.get('code')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Chat ID required'})
                }
            
            cur.execute(
                'UPDATE chats SET name = %s, config = %s, code = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, name, config, code, created_at',
                (name, json.dumps(config), code, chat_id)
            )
            conn.commit()
            
            chat = cur.fetchone()
            if not chat:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Chat not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': chat['id'],
                    'name': chat['name'],
                    'config': chat['config'],
                    'code': chat['code'],
                    'created_at': chat['created_at'].isoformat()
                })
            }
        
        if method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            chat_id = body_data.get('id')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Chat ID required'})
                }
            
            cur.execute('DELETE FROM chats WHERE id = %s', (chat_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()