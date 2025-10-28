import json
from typing import Dict, Any
from datetime import datetime

assistants_db = [
    {
        "id": "asst_001",
        "name": "Главный ассистент",
        "firstMessage": "Здравствуйте! Я главный ИИ-ассистент. Чем могу помочь?",
        "instructions": "Отвечать профессионально и подробно на все вопросы пользователей.",
        "model": "gpt-4o",
        "contextLength": 7,
        "humanEmulation": 8,
        "creativity": 0.7,
        "voiceRecognition": True,
        "status": "active",
        "created_at": "2025-01-15T10:00:00Z"
    },
    {
        "id": "asst_002",
        "name": "Служба поддержки",
        "firstMessage": "Привет! Я ассистент службы поддержки. Опишите вашу проблему.",
        "instructions": "Помогать решать технические проблемы пользователей.",
        "model": "gpt-3.5-turbo",
        "contextLength": 5,
        "humanEmulation": 6,
        "creativity": 0.5,
        "voiceRecognition": False,
        "status": "active",
        "created_at": "2025-01-20T14:30:00Z"
    }
]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление AI ассистентами
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP response с данными ассистентов
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
    
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(assistants_db)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        new_assistant = {
            'id': f"asst_{len(assistants_db) + 1:03d}",
            'name': body_data.get('name', ''),
            'firstMessage': body_data.get('firstMessage', ''),
            'instructions': body_data.get('instructions', ''),
            'model': body_data.get('model', 'gpt-4o'),
            'contextLength': body_data.get('contextLength', 5),
            'humanEmulation': body_data.get('humanEmulation', 5),
            'creativity': body_data.get('creativity', 0.7),
            'voiceRecognition': body_data.get('voiceRecognition', False),
            'status': 'active',
            'created_at': datetime.utcnow().isoformat() + 'Z'
        }
        assistants_db.insert(0, new_assistant)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps(new_assistant)
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        assistant_id = body_data.get('id')
        
        for assistant in assistants_db:
            if assistant['id'] == assistant_id:
                if 'name' in body_data:
                    assistant['name'] = body_data['name']
                if 'firstMessage' in body_data:
                    assistant['firstMessage'] = body_data['firstMessage']
                if 'instructions' in body_data:
                    assistant['instructions'] = body_data['instructions']
                if 'model' in body_data:
                    assistant['model'] = body_data['model']
                if 'contextLength' in body_data:
                    assistant['contextLength'] = body_data['contextLength']
                if 'humanEmulation' in body_data:
                    assistant['humanEmulation'] = body_data['humanEmulation']
                if 'creativity' in body_data:
                    assistant['creativity'] = body_data['creativity']
                if 'voiceRecognition' in body_data:
                    assistant['voiceRecognition'] = body_data['voiceRecognition']
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps(assistant)
                }
        
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Assistant not found'})
        }
    
    if method == 'DELETE':
        params = event.get('queryStringParameters', {})
        assistant_id = params.get('id')
        
        for i in range(len(assistants_db) - 1, -1, -1):
            if assistants_db[i]['id'] == assistant_id:
                assistants_db.pop(i)
                break
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }