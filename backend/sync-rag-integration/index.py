import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Синхронизация RAG баз данных с таблицей api_integrations
    Args: event с httpMethod, body (rag_id, action: create/update/delete, integration_data)
    Returns: HTTP response с результатом синхронизации
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    rag_id = body_data.get('rag_id')
    
    if not action or not rag_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing action or rag_id'}),
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
    cur = conn.cursor()
    
    try:
        if action == 'create':
            integration_data = body_data.get('integration_data', {})
            
            cur.execute('''
                INSERT INTO t_p5706452_ai_backend_tool.api_integrations 
                (id, name, description, api_base_url, function_name, function_description, function_parameters, response_mode)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                rag_id,
                integration_data.get('name'),
                integration_data.get('description'),
                integration_data.get('api_base_url'),
                integration_data.get('function_name'),
                integration_data.get('function_description'),
                json.dumps(integration_data.get('function_parameters', {})),
                integration_data.get('response_mode', 'json')
            ))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Integration created'}),
                'isBase64Encoded': False
            }
        
        elif action == 'update':
            integration_data = body_data.get('integration_data', {})
            
            cur.execute('''
                UPDATE t_p5706452_ai_backend_tool.api_integrations 
                SET name = %s, 
                    description = %s, 
                    api_base_url = %s, 
                    function_name = %s, 
                    function_description = %s, 
                    function_parameters = %s, 
                    response_mode = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                integration_data.get('name'),
                integration_data.get('description'),
                integration_data.get('api_base_url'),
                integration_data.get('function_name'),
                integration_data.get('function_description'),
                json.dumps(integration_data.get('function_parameters', {})),
                integration_data.get('response_mode', 'json'),
                rag_id
            ))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Integration updated'}),
                'isBase64Encoded': False
            }
        
        elif action == 'delete':
            cur.execute(
                'DELETE FROM t_p5706452_ai_backend_tool.api_integrations WHERE id = %s',
                (rag_id,)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Integration deleted'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
