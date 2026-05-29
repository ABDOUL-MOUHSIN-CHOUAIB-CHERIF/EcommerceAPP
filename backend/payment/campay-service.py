# backend/payments/campay_service.py
import requests
from django.conf import settings
import base64

class CamPayService:
    def __init__(self):
        self.base_url = settings.CAMPAY_BASE_URL
        self.app_id = settings.CAMPAY_APP_ID
        self.app_username = settings.CAMPAY_APP_USERNAME
        self.app_password = settings.CAMPAY_APP_PASSWORD
        self.permanent_token = settings.CAMPAY_PERMANENT_TOKEN
    
    def get_access_token(self):
        """Get access token using permanent token"""
        # Method 1: Use permanent token directly
        return self.permanent_token
    
    def request_payment(self, amount, phone_number, reference, description):
        """Request payment from customer"""
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