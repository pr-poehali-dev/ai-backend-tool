import json
import os
from typing import Dict, Any
import urllib.request
import urllib.parse
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Поиск жилья через API QQRenta
    Args: event с queryStringParameters (city, checkin, nights, guests)
    Returns: HTTP response со списком вариантов жилья
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
    
    params = event.get('queryStringParameters', {})
    city = params.get('city', '')
    checkin = params.get('checkin', '')
    nights = params.get('nights', '')
    guests = params.get('guests', '')
    
    if not all([city, checkin, nights, guests]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Missing required parameters',
                'required': ['city', 'checkin', 'nights', 'guests']
            }),
            'isBase64Encoded': False
        }
    
    try:
        query_params = urllib.parse.urlencode({
            'city': city,
            'checkin': checkin,
            'nights': nights,
            'guests': guests
        })
        
        api_url = f'https://api2.qqrenta.ru/api/v2/search?{query_params}'
        
        req = urllib.request.Request(
            api_url,
            headers={'Accept': 'application/json'},
            method='GET'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            response_data = response.read().decode('utf-8')
            results = json.loads(response_data)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(results),
                'isBase64Encoded': False
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return {
            'statusCode': e.code,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'API error: {error_body}'}),
            'isBase64Encoded': False
        }
    
    except urllib.error.URLError as e:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Connection error: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }