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
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
            
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': response.text,
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = event.get('body', '{}')
            
            files = {}
            data = {}
            content_type = event.get('headers', {}).get('content-type', '')
            
            if 'multipart/form-data' in content_type:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Загрузка файлов через прокси не поддерживается'}),
                    'isBase64Encoded': False
                }
            
            response = requests.post(
                'https://gptunnel.ru/v1/database/create',
                headers=headers,
                data=body,
                timeout=60
            )
            
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': response.text,
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            raw_body = event.get('body', '{}')
            print(f"DEBUG: Raw body: {raw_body}")
            
            body = json.loads(raw_body) if raw_body else {}
            database_id = body.get('id')
            
            print(f"DEBUG: Parsed body: {body}, ID: {database_id}")
            
            if not database_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'ID базы данных обязателен. Body: {body}'}),
                    'isBase64Encoded': False
                }
            
            print(f"DEBUG: Deleting database with ID: {database_id}")
            
            response = requests.delete(
                f'https://gptunnel.ru/v1/database/{database_id}',
                headers={'Authorization': gptunnel_api_key},
                timeout=30
            )
            
            print(f"DEBUG: GPTunnel response status: {response.status_code}")
            print(f"DEBUG: GPTunnel response text: {response.text}")
            
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