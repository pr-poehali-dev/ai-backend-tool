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
            
            print(f"[DEBUG] Received from frontend: {json.dumps(body_data, ensure_ascii=False)[:300]}")
            
            database_id = body_data.get('databaseId')
            source_type = body_data.get('sourceType', 'text')
            content = body_data.get('content', '')
            name = body_data.get('name', 'Без названия')
            
            if not database_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется databaseId. Сначала создайте базу данных в GPTunnel'}),
                    'isBase64Encoded': False
                }
            
            # Конвертация типов источников из нашего формата в формат GPTunnel
            source_type_mapping = {
                'text': 'text',
                'json': 'text',  # JSON передаём как текст
                'xml': 'text',   # XML передаём как текст
                'api': 'url',    # API URL
                'pdf': 'file',
                'docx': 'file',
                'csv': 'file',
                'excel': 'file'
            }
            
            gptunnel_source_type = source_type_mapping.get(source_type, 'text')
            
            # Формируем payload для GPTunnel
            add_file_payload = {
                'databaseId': database_id,
                'name': name,
                'sourceType': gptunnel_source_type
            }
            
            # Добавляем content в зависимости от типа
            if gptunnel_source_type == 'url':
                add_file_payload['url'] = content
            elif gptunnel_source_type == 'text':
                add_file_payload['text'] = content
            elif gptunnel_source_type == 'file':
                # Для файлов нужна base64 или URL
                add_file_payload['text'] = content  # Временно как текст
            
            print(f"[DEBUG] Sending to GPTunnel: {json.dumps(add_file_payload, ensure_ascii=False)[:300]}")
            
            response = requests.post(
                'https://gptunnel.ru/v1/database/file/add',
                headers=headers,
                json=add_file_payload,
                timeout=60
            )
            
            print(f"[DEBUG] GPTunnel response status: {response.status_code}")
            print(f"[DEBUG] GPTunnel response body: {response.text[:500]}")
            
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