# backend/payments/views.py
import json
import uuid
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def initiate_mobile_payment(request):
    """Initiate MTN or Orange Money payment via CamPay API"""
    print("=== CAMPAY PAYMENT INITIATED ===")
    
    try:
        data = json.loads(request.body)
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        order_id = data.get('order_id')
        
        # Clean phone number
        phone_number = str(phone_number).strip()
        
        if len(phone_number) != 9:
            return JsonResponse({
                'success': False,
                'message': 'Phone number must be 9 digits'
            }, status=400)
        
        # Add Cameroon country code
        full_phone_number = f"237{phone_number}"
        
        # Generate unique reference
        reference = f"EVEREST_{order_id}_{uuid.uuid4().hex[:8]}"
        
        print(f"Amount: {amount} CFA")
        print(f"Phone: {full_phone_number}")
        print(f"Reference: {reference}")
        
        # CamPay authentication using Permanent Token
        headers = {
            "Authorization": f"Token {settings.CAMPAY_PERMANENT_TOKEN}",
            "Content-Type": "application/json"
        }
        
        url = f"{settings.CAMPAY_BASE_URL}/api/collection/"
        
        payload = {
            "amount": str(int(amount)),
            "currency": "XAF",
            "from": full_phone_number,
            "to": settings.CAMPAY_MERCHANT_PHONE,
            "description": f"Everest Order #{order_id}",
            "external_reference": reference
        }
        
        print("Sending request to CamPay...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            return JsonResponse({
                'success': True,
                'reference': reference,
                'transaction_id': result.get('transaction_id'),
                'message': f'✅ USSD prompt sent to {phone_number}. Please check your phone.',
                'status': result.get('status', 'pending')
            })
        else:
            error_msg = response.json().get('message', 'Payment failed')
            return JsonResponse({
                'success': False,
                'message': error_msg
            }, status=400)
        
    except requests.exceptions.RequestException as e:
        print(f"Network error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Payment service unavailable'
        }, status=500)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@require_http_methods(["GET"])
def check_payment_status(request, reference):
    """Check payment status"""
    print(f"Checking status for: {reference}")
    
    headers = {
        "Authorization": f"Token {settings.CAMPAY_PERMANENT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    url = f"{settings.CAMPAY_BASE_URL}/api/transaction/{reference}/"
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            status = result.get('status')
            
            if status == 'successful':
                return JsonResponse({
                    'success': True,
                    'status': 'successful',
                    'message': 'Payment completed'
                })
            elif status == 'pending':
                return JsonResponse({
                    'success': True,
                    'status': 'pending',
                    'message': 'Waiting for PIN...'
                })
        
        return JsonResponse({
            'success': True,
            'status': 'pending',
            'message': 'Checking status...'
        })
        
    except Exception as e:
        print(f"Status check error: {str(e)}")
        return JsonResponse({
            'success': True,
            'status': 'pending',
            'message': 'Checking status...'
        }, status=200)


@csrf_exempt
@require_http_methods(["POST"])
def payment_webhook(request):
    """CamPay webhook endpoint - called when payment is completed"""
    print("=== WEBHOOK RECEIVED ===")
    
    try:
        body = request.body.decode('utf-8')
        print(f"Raw body: {body}")
        
        data = json.loads(body)
        print(f"Parsed data: {data}")
        
        reference = data.get('external_reference')
        status = data.get('status')
        transaction_id = data.get('transaction_id')
        
        if status == 'successful':
            print(f"✅ Payment successful for reference: {reference}")
            print(f"   Transaction ID: {transaction_id}")
            # Here you can update your order status in the database
            # order_id = reference.split('_')[1] if '_' in reference else None
            # Update order status to 'paid'
        
        return JsonResponse({'status': 'ok'})
        
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)