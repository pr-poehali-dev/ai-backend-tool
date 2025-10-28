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
            
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': response.text,
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_str = event.get('body', '{}')
            body_data = json.loads(body_str)
            
            print(f"[DEBUG] Received body: {json.dumps(body_data, ensure_ascii=False)}")
            
            # Шаг 1: Попробуем создать базу данных
            create_db_payload = {
                'name': body_data.get('name'),
                'description': body_data.get('description')
            }
            
            print(f"[DEBUG] Step 1: Creating database with: {json.dumps(create_db_payload, ensure_ascii=False)}")
            
            # Попробуем разные endpoint'ы для создания базы
            endpoints_to_try = [
                'https://gptunnel.ru/v1/database/create',
                'https://gptunnel.ru/v1/database/add',
                'https://gptunnel.ru/v1/database'
            ]
            
            database_id = None
            for endpoint in endpoints_to_try:
                try:
                    print(f"[DEBUG] Trying endpoint: {endpoint}")
                    create_response = requests.post(
                        endpoint,
                        headers=headers,
                        json=create_db_payload,
                        timeout=30
                    )
                    print(f"[DEBUG] Response status: {create_response.status_code}")
                    print(f"[DEBUG] Response body: {create_response.text}")
                    
                    if create_response.status_code == 200:
                        response_data = create_response.json()
                        database_id = response_data.get('id') or response_data.get('databaseId')
                        print(f"[DEBUG] Database created with ID: {database_id}")
                        break
                except Exception as e:
                    print(f"[DEBUG] Endpoint {endpoint} failed: {str(e)}")
                    continue
            
            if not database_id:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не удалось создать базу данных. Проверьте логи для деталей.'}),
                    'isBase64Encoded': False
                }
            
            # Шаг 2: Добавляем файл в созданную базу
            add_file_payload = {
                'databaseId': database_id,
                'name': body_data.get('name'),
                'sourceType': body_data.get('sourceType'),
                'content': body_data.get('content')
            }
            
            print(f"[DEBUG] Step 2: Adding file to database: {database_id}")
            
            file_response = requests.post(
                'https://gptunnel.ru/v1/database/file/add',
                headers=headers,
                json=add_file_payload,
                timeout=60
            )
            
            print(f"[DEBUG] File add response status: {file_response.status_code}")
            print(f"[DEBUG] File add response body: {file_response.text}")
            
            return {
                'statusCode': file_response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': file_response.text,
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