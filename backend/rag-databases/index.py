import json
import os
import requests
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Проксирование запросов к GPTunnel RAG API
    Args: event с httpMethod, queryStringParameters, body
          context с request_id
    Returns: HTTP response с данными RAG баз
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
    
    gptunnel_api_key = os.environ.get('GPTUNNEL_API_KEY')
    if not gptunnel_api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'GPTUNNEL_API_KEY не настроен. Добавьте секрет во вкладке Настройки'}),
            'isBase64Encoded': False
        }
    
    headers = {
        'Authorization': gptunnel_api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'GET':
            response = requests.get(
                'https://gptunnel.ru/v1/database/list',
                headers={'Authorization': gptunnel_api_key},
                timeout=30
            )
            
            print(f"[DEBUG] GET /v1/database/list - Status: {response.status_code}")
            print(f"[DEBUG] Response body: {response.text}")
            
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': response.text,
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_str = event.get('body', '{}')
            body_data = json.loads(body_str)
            
            database_id = body_data.get('databaseId')
            
            if not database_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется databaseId. Сначала создайте базу данных в GPTunnel'}),
                    'isBase64Encoded': False
                }
            
            add_file_payload = {
                'databaseId': database_id,
                'name': body_data.get('name'),
                'sourceType': body_data.get('sourceType'),
                'content': body_data.get('content')
            }
            
            print(f"[DEBUG] Adding file to database {database_id}: {json.dumps(add_file_payload, ensure_ascii=False)[:200]}")
            
            response = requests.post(
                'https://gptunnel.ru/v1/database/file/add',
                headers=headers,
                json=add_file_payload,
                timeout=60
            )
            
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response body: {response.text}")
            
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': response.text,
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except requests.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка запроса к GPTunnel: {str(e)}'}),
            'isBase64Encoded': False
        }