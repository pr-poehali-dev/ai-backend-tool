import json
import os
from typing import Dict, Any
import requests
import psycopg2
import time

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Создание chat completions через GPTunnel
    Args: event с httpMethod, body
          context с request_id
    Returns: HTTP response с ответом модели
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    api_key = os.environ.get('GPTUNNEL_API_KEY')
    if not api_key:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'GPTunnel API не настроен'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        model = body_data.get('model', 'unknown')
        
        start_time = time.time()
        response = requests.post(
            'https://gptunnel.ru/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json=body_data,
            timeout=30
        )
        latency_ms = int((time.time() - start_time) * 1000)
        
        tokens_prompt = 0
        tokens_completion = 0
        tokens_total = 0
        
        if response.status_code == 200:
            try:
                response_json = response.json()
                usage = response_json.get('usage', {})
                tokens_prompt = usage.get('prompt_tokens', 0)
                tokens_completion = usage.get('completion_tokens', 0)
                tokens_total = usage.get('total_tokens', 0)
            except:
                pass
        
        if database_url:
            try:
                conn = psycopg2.connect(database_url)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO api_requests (endpoint, method, status_code, latency_ms, tokens_prompt, tokens_completion, tokens_total, model)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ''', ('/v1/chat/completions', 'POST', response.status_code, latency_ms, tokens_prompt, tokens_completion, tokens_total, model))
                
                cursor.execute('''
                    INSERT INTO usage_stats (endpoint, model, request_count, total_tokens, total_prompt_tokens, total_completion_tokens)
                    VALUES (%s, %s, 1, %s, %s, %s)
                    ON CONFLICT (endpoint, model, date) 
                    DO UPDATE SET 
                        request_count = usage_stats.request_count + 1,
                        total_tokens = usage_stats.total_tokens + EXCLUDED.total_tokens,
                        total_prompt_tokens = usage_stats.total_prompt_tokens + EXCLUDED.total_prompt_tokens,
                        total_completion_tokens = usage_stats.total_completion_tokens + EXCLUDED.total_completion_tokens,
                        updated_at = CURRENT_TIMESTAMP
                ''', ('/v1/chat/completions', model, tokens_total, tokens_prompt, tokens_completion))
                
                conn.commit()
                cursor.close()
                conn.close()
            except:
                pass
        
        return {
            'statusCode': response.status_code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': response.text,
            'isBase64Encoded': False
        }
        
    except requests.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка GPTunnel API: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }