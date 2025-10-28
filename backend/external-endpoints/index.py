import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление внешними API эндпоинтами
    Args: event с httpMethod, body, queryStringParameters
          context с request_id
    Returns: HTTP response с данными эндпоинтов
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
                SELECT id, name, url, method, description, headers, 
                       auth_type, auth_config, active, created_at
                FROM external_endpoints
                ORDER BY created_at DESC
            ''')
            endpoints = cursor.fetchall()
            
            result = []
            for ep in endpoints:
                result.append({
                    'id': ep['id'],
                    'name': ep['name'],
                    'url': ep['url'],
                    'method': ep['method'],
                    'description': ep['description'],
                    'headers': ep['headers'],
                    'authType': ep['auth_type'],
                    'authConfig': ep['auth_config'],
                    'active': ep['active'],
                    'createdAt': ep['created_at'].isoformat() if ep['created_at'] else None
                })
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            name = body_data.get('name')
            url = body_data.get('url')
            http_method = body_data.get('method', 'POST')
            description = body_data.get('description', '')
            headers = body_data.get('headers', {})
            auth_type = body_data.get('authType', 'none')
            auth_config = body_data.get('authConfig', {})
            
            if not name or not url:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Name and URL are required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                INSERT INTO external_endpoints 
                (name, url, method, description, headers, auth_type, auth_config)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, url, method, description, headers, 
                          auth_type, auth_config, active, created_at
            ''', (name, url, http_method, description, json.dumps(headers), 
                  auth_type, json.dumps(auth_config)))
            
            new_endpoint = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': new_endpoint['id'],
                    'name': new_endpoint['name'],
                    'url': new_endpoint['url'],
                    'method': new_endpoint['method'],
                    'description': new_endpoint['description'],
                    'headers': new_endpoint['headers'],
                    'authType': new_endpoint['auth_type'],
                    'authConfig': new_endpoint['auth_config'],
                    'active': new_endpoint['active'],
                    'createdAt': new_endpoint['created_at'].isoformat() if new_endpoint['created_at'] else None
                }),
                'isBase64Encoded': False
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            endpoint_id = body_data.get('id')
            
            if not endpoint_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Endpoint ID is required'}),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if 'name' in body_data:
                updates.append('name = %s')
                params.append(body_data['name'])
            if 'url' in body_data:
                updates.append('url = %s')
                params.append(body_data['url'])
            if 'method' in body_data:
                updates.append('method = %s')
                params.append(body_data['method'])
            if 'description' in body_data:
                updates.append('description = %s')
                params.append(body_data['description'])
            if 'headers' in body_data:
                updates.append('headers = %s')
                params.append(json.dumps(body_data['headers']))
            if 'authType' in body_data:
                updates.append('auth_type = %s')
                params.append(body_data['authType'])
            if 'authConfig' in body_data:
                updates.append('auth_config = %s')
                params.append(json.dumps(body_data['authConfig']))
            if 'active' in body_data:
                updates.append('active = %s')
                params.append(body_data['active'])
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(endpoint_id)
            
            cursor.execute(f'''
                UPDATE external_endpoints 
                SET {', '.join(updates)}
                WHERE id = %s
                RETURNING id, name, url, method, description, headers,
                          auth_type, auth_config, active, created_at
            ''', params)
            
            updated_endpoint = cursor.fetchone()
            
            if not updated_endpoint:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Endpoint not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': updated_endpoint['id'],
                    'name': updated_endpoint['name'],
                    'url': updated_endpoint['url'],
                    'method': updated_endpoint['method'],
                    'description': updated_endpoint['description'],
                    'headers': updated_endpoint['headers'],
                    'authType': updated_endpoint['auth_type'],
                    'authConfig': updated_endpoint['auth_config'],
                    'active': updated_endpoint['active'],
                    'createdAt': updated_endpoint['created_at'].isoformat() if updated_endpoint['created_at'] else None
                }),
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
