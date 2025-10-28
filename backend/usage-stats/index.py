import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение статистики использования токенов и запросов
    Args: event с httpMethod, queryStringParameters с days
          context с request_id
    Returns: HTTP response со статистикой использования
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
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
    
    query_params = event.get('queryStringParameters') or {}
    days = int(query_params.get('days', 30))
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute('''
            SELECT 
                endpoint,
                model,
                date,
                request_count,
                total_tokens,
                total_prompt_tokens,
                total_completion_tokens
            FROM usage_stats
            WHERE date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY date DESC, endpoint, model
        ''' % days)
        
        stats = cursor.fetchall()
        
        result = []
        for row in stats:
            result.append({
                'endpoint': row['endpoint'],
                'model': row['model'] if row['model'] else 'unknown',
                'date': row['date'].isoformat() if row['date'] else None,
                'request_count': row['request_count'] or 0,
                'total_tokens': row['total_tokens'] or 0,
                'total_prompt_tokens': row['total_prompt_tokens'] or 0,
                'total_completion_tokens': row['total_completion_tokens'] or 0
            })
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
