#!/usr/bin/env python3
"""
Test script for Supporter Engagement Platform Personalization Engine

Usage: python test-personalization.py [API_URL]
Example: python test-personalization.py https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/
"""

import sys
import json
import time
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# API URL from command line or default
API_URL = sys.argv[1] if len(sys.argv) > 1 else 'https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/'

print('=' * 50)
print('Testing Personalization Engine')
print('=' * 50)
print(f'API URL: {API_URL}')
print()

def make_request(method, endpoint, data=None):
    """Make HTTP request to API"""
    url = f"{API_URL}{endpoint}"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = Request(url, data=data, headers=headers, method=method)
    
    try:
        start_time = time.time()
        with urlopen(req, timeout=30) as response:
            duration = (time.time() - start_time) * 1000
            body = response.read().decode('utf-8')
            return {
                'status_code': response.status,
                'body': json.loads(body) if body else None,
                'duration': duration
            }
    except HTTPError as e:
        duration = (time.time() - start_time) * 1000
        body = e.read().decode('utf-8')
        return {
            'status_code': e.code,
            'body': body,
            'duration': duration,
            'error': str(e)
        }
    except URLError as e:
        return {
            'status_code': 0,
            'body': None,
            'duration': 0,
            'error': str(e)
        }

# Test scenarios
tests = [
    {
        'name': 'Test 1: First-time donor inquiry',
        'endpoint': 'agent',
        'method': 'POST',
        'data': {
            'userId': 'test-user-001',
            'input': {
                'text': 'I want to make my first donation to support cancer research. What would you recommend?',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            },
            'sessionId': f'session-{int(time.time())}'
        }
    },
    {
        'name': 'Test 2: Returning supporter',
        'endpoint': 'agent',
        'method': 'POST',
        'data': {
            'userId': 'test-user-002',
            'input': {
                'text': 'I donated £50 last year. How has my contribution helped?',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            },
            'sessionId': f'session-{int(time.time())}'
        }
    },
    {
        'name': 'Test 3: Event participation inquiry',
        'endpoint': 'agent',
        'method': 'POST',
        'data': {
            'userId': 'test-user-003',
            'input': {
                'text': 'I want to participate in Race for Life. What do I need to know?',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            },
            'sessionId': f'session-{int(time.time())}'
        }
    },
    {
        'name': 'Test 4: Personalized recommendation',
        'endpoint': 'agent',
        'method': 'POST',
        'data': {
            'userId': 'test-user-004',
            'input': {
                'text': 'Based on my interests in breast cancer research, what campaigns should I support?',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            },
            'sessionId': f'session-{int(time.time())}'
        }
    },
    {
        'name': 'Test 5: Get user profile',
        'endpoint': 'profile?userId=test-user-001',
        'method': 'GET',
        'data': None
    }
]

# Run tests
def run_tests():
    for i, test in enumerate(tests, 1):
        print('-' * 50)
        print(f"{test['name']}")
        print('-' * 50)
        
        print(f"📤 Request: {test['method']} /{test['endpoint']}")
        if test['data']:
            print(f"📝 Payload:")
            print(json.dumps(test['data'], indent=2))
        
        response = make_request(test['method'], test['endpoint'], test['data'])
        
        print(f"📥 Response: HTTP {response['status_code']} ({response['duration']:.0f}ms)")
        
        if response['status_code'] == 200:
            print('✅ SUCCESS')
            print('Response body:')
            print(json.dumps(response['body'], indent=2))
        elif response['status_code'] == 503:
            print('❌ FAILED - Service Unavailable (Lambda error)')
            print(f"Response: {response['body']}")
            print()
            print('💡 Troubleshooting:')
            print('   1. Check Lambda handler configuration')
            print('   2. Review CloudWatch logs')
            print('   3. Verify Lambda has correct permissions')
        elif response['status_code'] == 404:
            print('⚠️  NOT FOUND - User or resource does not exist')
            print(f"Response: {response['body']}")
        elif response['status_code'] == 0:
            print(f"❌ CONNECTION ERROR: {response.get('error', 'Unknown error')}")
        else:
            print(f"⚠️  HTTP {response['status_code']}")
            print(f"Response: {response['body']}")
            if 'error' in response:
                print(f"Error: {response['error']}")
        
        print()
        
        # Wait 1 second between tests
        if i < len(tests):
            time.sleep(1)
    
    print('=' * 50)
    print('✅ All tests completed!')
    print('=' * 50)

if __name__ == '__main__':
    try:
        run_tests()
    except KeyboardInterrupt:
        print('\n\n⚠️  Tests interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ Unexpected error: {e}')
        sys.exit(1)
