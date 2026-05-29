# backend/payments/views.py
import json
import uuid
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

class CamPayService:
    def __init__(self):
        self.base_url = settings.CAMPAY_BASE_URL
        self.permanent_token = settings.CAMPAY_PERMANENT_TOKEN
    
    def get_access_token(self):
        """Return the permanent token for API access"""
        return self.permanent_token
    
    def request_payment(self, amount, phone_number, reference, description):
        """Request payment from customer via CamPay"""
        url = f"{self.base_url}/api/collect/"
        
        # Format phone number with country code
        if not phone_number.startswith('237'):
            phone_number = f"237{phone_number}"
        
        headers = {
            "Authorization": f"Token {self.permanent_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "amount": str(int(amount)),
            "currency": "XAF",
            "from": phone_number,
            "description": description,
            "external_reference": reference
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"Payment request failed: {response.text}")
    
    def check_transaction(self, reference):
        """Check transaction status"""
        url = f"{self.base_url}/api/transaction/{reference}/"
        
        headers = {
            "Authorization": f"Token {self.permanent_token}"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to check transaction: {response.text}")

# Initialize CamPay service
campay_service = CamPayService()

@csrf_exempt
@require_http_methods(["POST"])
def initiate_mobile_payment(request):
    """Initiate MTN or Orange Money payment"""
    try:
        data = json.loads(request.body)
        
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        order_id = data.get('order_id')
        
        # Validate phone number format
        phone_number = str(phone_number).strip()
        if not phone_number.isdigit():
            return JsonResponse({
                'success': False,
                'message': 'Phone number must contain only digits'
            }, status=400)
        
        # Generate unique reference
        reference = f"EVEREST_{order_id}_{uuid.uuid4().hex[:8]}"
        
        # Request payment from CamPay
        try:
            result = campay_service.request_payment(
                amount=amount,
                phone_number=phone_number,
                reference=reference,
                description=f"Everest Order #{order_id}"
            )
            
            return JsonResponse({
                'success': True,
                'reference': reference,
                'transaction_id': result.get('transaction_id'),
                'message': 'Payment initiated. Please check your phone and enter your PIN.',
                'status': result.get('status')
            })
            
        except Exception as e:
            error_msg = str(e)
            if "ER101" in error_msg:
                message = "Invalid phone number. Use format: 6XXXXXXXX or 65XXXXXXXX"
            elif "ER102" in error_msg:
                message = "Only MTN and Orange Cameroon numbers are accepted"
            else:
                message = f"Payment failed: {error_msg}"
            
            return JsonResponse({
                'success': False,
                'message': message
            }, status=400)
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def check_payment_status(request, reference):
    """Check payment status"""
    try:
        result = campay_service.check_transaction(reference)
        
        status = result.get('status')
        
        if status == 'successful':
            return JsonResponse({
                'success': True,
                'status': 'successful',
                'message': 'Payment completed successfully'
            })
        elif status == 'pending':
            return JsonResponse({
                'success': True,
                'status': 'pending',
                'message': 'Payment pending. Please check your phone.'
            })
        elif status == 'failed':
            return JsonResponse({
                'success': False,
                'status': 'failed',
                'message': 'Payment failed. Please try again.'
            })
        else:
            return JsonResponse({
                'success': False,
                'status': 'unknown',
                'message': 'Unknown payment status'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@require_http_methods(["GET"])
def test_campay_connection(request):
    """Test if CamPay keys are working"""
    try:
        token = campay_service.get_access_token()
        return JsonResponse({
            'success': True,
            'message': 'CamPay connection successful!',
            'token_preview': token[:20] + '...' if token else 'None'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)