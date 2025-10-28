import json
import os
from typing import Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление AI ассистентами с сохранением в БД и статистикой
    Args: event с httpMethod, body, queryStringParameters
    Returns: HTTP response с данными ассистентов и статистикой использования
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
    
    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            cursor.execute('''
                SELECT 
                    a.*,
                    COALESCE(SUM(u.message_count), 0) as total_messages,
                    COALESCE(SUM(u.tokens_used), 0) as total_tokens,
                    COUNT(DISTINCT u.user_id) as unique_users
                FROM assistants a
                LEFT JOIN assistant_usage u ON a.id = u.assistant_id
                GROUP BY a.id
                ORDER BY a.created_at DESC
            ''')
            assistants = cursor.fetchall()
            
            result = []
            for assistant in assistants:
                result.append({
                    'id': assistant['id'],
                    'name': assistant['name'],
                    'firstMessage': assistant['first_message'],
                    'instructions': assistant['instructions'],
                    'model': assistant['model'],
                    'contextLength': assistant['context_length'],
                    'humanEmulation': assistant['human_emulation'],
                    'creativity': float(assistant['creativity']),
                    'voiceRecognition': assistant['voice_recognition'],
                    'status': assistant['status'],
                    'created_at': assistant['created_at'].isoformat() if assistant['created_at'] else None,
                    'stats': {
                        'totalMessages': int(assistant['total_messages']),
                        'totalTokens': int(assistant['total_tokens']),
                        'uniqueUsers': int(assistant['unique_users'])
                    }
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            assistant_id = f"asst_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
            
            cursor.execute('''
                INSERT INTO assistants (
                    id, name, first_message, instructions, model,
                    context_length, human_emulation, creativity,
                    voice_recognition, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            ''', (
                assistant_id,
                body_data.get('name', 'Новый ассистент'),
                body_data.get('firstMessage', ''),
                body_data.get('instructions', ''),
                body_data.get('model', 'gpt-4o'),
                body_data.get('contextLength', 5),
                body_data.get('humanEmulation', 5),
                body_data.get('creativity', 0.7),
                body_data.get('voiceRecognition', False),
                'active'
            ))
            
            new_assistant = cursor.fetchone()
            conn.commit()
            
            result = {
                'id': new_assistant['id'],
                'name': new_assistant['name'],
                'firstMessage': new_assistant['first_message'],
                'instructions': new_assistant['instructions'],
                'model': new_assistant['model'],
                'contextLength': new_assistant['context_length'],
                'humanEmulation': new_assistant['human_emulation'],
                'creativity': float(new_assistant['creativity']),
                'voiceRecognition': new_assistant['voice_recognition'],
                'status': new_assistant['status'],
                'created_at': new_assistant['created_at'].isoformat(),
                'stats': {
                    'totalMessages': 0,
                    'totalTokens': 0,
                    'uniqueUsers': 0
                }
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        if method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            assistant_id = body_data.get('id')
            
            if not assistant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Assistant ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                UPDATE assistants
                SET name = %s,
                    first_message = %s,
                    instructions = %s,
                    model = %s,
                    context_length = %s,
                    human_emulation = %s,
                    creativity = %s,
                    voice_recognition = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            ''', (
                body_data.get('name'),
                body_data.get('firstMessage'),
                body_data.get('instructions'),
                body_data.get('model'),
                body_data.get('contextLength'),
                body_data.get('humanEmulation'),
                body_data.get('creativity'),
                body_data.get('voiceRecognition'),
                assistant_id
            ))
            
            updated = cursor.fetchone()
            
            if not updated:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Assistant not found'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            cursor.execute('''
                SELECT 
                    COALESCE(SUM(message_count), 0) as total_messages,
                    COALESCE(SUM(tokens_used), 0) as total_tokens,
                    COUNT(DISTINCT user_id) as unique_users
                FROM assistant_usage
                WHERE assistant_id = %s
            ''', (assistant_id,))
            
            stats = cursor.fetchone()
            
            result = {
                'id': updated['id'],
                'name': updated['name'],
                'firstMessage': updated['first_message'],
                'instructions': updated['instructions'],
                'model': updated['model'],
                'contextLength': updated['context_length'],
                'humanEmulation': updated['human_emulation'],
                'creativity': float(updated['creativity']),
                'voiceRecognition': updated['voice_recognition'],
                'status': updated['status'],
                'created_at': updated['created_at'].isoformat(),
                'stats': {
                    'totalMessages': int(stats['total_messages']),
                    'totalTokens': int(stats['total_tokens']),
                    'uniqueUsers': int(stats['unique_users'])
                }
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps(result)
            }
        
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            assistant_id = params.get('id')
            
            if not assistant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Assistant ID required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('UPDATE assistants SET status = %s WHERE id = %s', ('inactive', assistant_id))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
