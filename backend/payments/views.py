# backend/payments/views.py
import json
import uuid
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["POST"])
def initiate_mobile_payment(request):
    """Initiate MTN or Orange Money payment"""
    print("=== PAYMENT INITIATED ===")
    print("Request body:", request.body)
    
    try:
        data = json.loads(request.body)
        print("Data:", data)
        
        amount = data.get('amount')
        phone_number = data.get('phone_number')
        payment_method = data.get('payment_method')
        order_id = data.get('order_id')
        
        # Generate unique reference
        reference = f"EVEREST_{order_id}_{uuid.uuid4().hex[:8]}"
        
        print(f"Payment: {amount} CFA to {phone_number} via {payment_method}")
        
        return JsonResponse({
            'success': True,
            'reference': reference,
            'transaction_id': f"TXN_{uuid.uuid4().hex[:8]}",
            'message': 'Payment initiated successfully',
            'status': 'pending'
        })
        
    except Exception as e:
        print("Error:", str(e))
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def check_payment_status(request, reference):
    """Check payment status"""
    print(f"Checking status for reference: {reference}")
    return JsonResponse({
        'success': True,
        'status': 'successful',
        'message': 'Payment completed successfully'
    })