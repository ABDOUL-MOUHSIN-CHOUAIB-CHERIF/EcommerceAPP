// frontend/src/app/pages/checkout/checkout.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';
import { PaymentService } from '../../core/services/payment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  
  cartItems: any[] = [];
  userProfile: any = null;
  userId: number | null = null;
  isLoading: boolean = true;
  isProcessing: boolean = false;
  paymentReference: string = '';
  
  // Phone validation properties
  phoneError: string = '';
  detectedProvider: string = '';
  
  subtotal: number = 0;
  deliveryPrice: number = 0;
  total: number = 0;
  
  shippingDetails = {
    fullName: '',
    phoneNumber: '',
    deliveryAddress: '',
    city: '',
    postalCode: ''
  };
  
  deliveryMethods = [
    { id: 'standard', name: 'Standard Shipping', days: '3-5 Business Days', price: 0, selected: true },
    { id: 'express', name: 'Express Courier', days: 'Same day in Douala/Yaoundé', price: 5500, selected: false }
  ];
  
  paymentMethods = [
    { id: 'mobile_money', name: 'MTN Mobile Money', description: 'Pay with MTN Momo', icon: '📱', selected: true },
    { id: 'orange_money', name: 'Orange Money', description: 'Pay with Orange Money', icon: '📱', selected: false },
  ];
  
  selectedDelivery = this.deliveryMethods[0];
  selectedPayment = this.paymentMethods[0];
  
  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAllData();
  }


loadAllData() {
  this.isLoading = true;
  this.cdr.detectChanges();

  this.cartService.getCart(this.userId!).subscribe({
    next: (cartResponse: any) => {
      console.log('Cart response:', cartResponse);
      
      const rawCartItems = cartResponse.items || [];

      if (rawCartItems.length === 0) {
        this.cartItems = [];
        this.calculateAll();
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      // ✅ FIXED: Use product data directly from cart response
      this.cartItems = rawCartItems.map((item: any) => {
        const product = item.product;
        
        return {
          id: item.id,
          quantity: item.quantity,
          product: {
            id: product?.id || 0,
            name: product?.name || 'Unknown Product',
            price: product?.price || 0,
            image_url: product?.image_url || '',
            category: product?.category || 'General'
          }
        };
      });

      console.log('✅ Cart items loaded:', this.cartItems);

      // Load user profile
      this.authService.getProfile().subscribe({
        next: (profile: any) => {
          this.userProfile = profile;
          if (this.userProfile) {
            this.shippingDetails.fullName = this.userProfile.full_name || this.userProfile.username || '';
            this.shippingDetails.phoneNumber = this.userProfile.phone || '';
          }
          this.calculateAll();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.calculateAll();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: (error: any) => {
      console.error('Error loading cart:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}

  calculateAll() {
    this.subtotal = this.cartItems.reduce((sum: number, item: any) => {
      const price = item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    this.deliveryPrice = this.selectedDelivery.price;
    this.total = this.subtotal + this.deliveryPrice;
    this.cdr.detectChanges();
  }

  selectDelivery(method: any) {
    this.deliveryMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedDelivery = method;
    this.calculateAll();
  }

  selectPayment(method: any) {
    this.paymentMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedPayment = method;
    this.cdr.detectChanges();
  }

  //  DETECT PROVIDER FROM PHONE NUMBER
  detectProvider(phone: string): string {
    if (!phone) return '';
    
    const cleanPhone = phone.trim();
    
    // MTN Cameroon: starts with 6 (not 65, 68, 69)
    if (cleanPhone.startsWith('6') && 
        !cleanPhone.startsWith('65') && 
        !cleanPhone.startsWith('68') && 
        !cleanPhone.startsWith('69')) {
      return 'mtn';
    }
    
    // Orange Cameroon: starts with 65, 68, 69
    if (cleanPhone.startsWith('65') || cleanPhone.startsWith('68') || cleanPhone.startsWith('69')) {
      return 'orange';
    }
    
    return 'unknown';
  }

  //  GET PROVIDER DISPLAY NAME
  getProviderDisplayName(provider: string): string {
    switch(provider) {
      case 'mtn': return 'MTN Cameroon';
      case 'orange': return 'Orange Cameroon';
      default: return 'Unknown';
    }
  }

  //  GET PROVIDER COLOR CLASS
  getProviderColorClass(provider: string): string {
    switch(provider) {
      case 'mtn': return 'provider-mtn';
      case 'orange': return 'provider-orange';
      default: return 'provider-unknown';
    }
  }

  //  AUTO DETECT AND SET PAYMENT METHOD
  detectAndSetProvider() {
    const phone = this.shippingDetails.phoneNumber;
    if (!phone) {
      this.detectedProvider = '';
      this.phoneError = '';
      return;
    }
    
    const provider = this.detectProvider(phone);
    this.detectedProvider = provider;
    
    if (provider === 'mtn') {
      this.selectedPayment = this.paymentMethods.find(p => p.id === 'mobile_money')!;
      this.phoneError = '';
    } 
    else if (provider === 'orange') {
      this.selectedPayment = this.paymentMethods.find(p => p.id === 'orange_money')!;
      this.phoneError = '';
    }
    else if (phone.length >= 1 && phone.length < 9) {
      this.phoneError = 'Phone number must be 9 digits (e.g., 670000000)';
    }
    else if (phone.length === 9 && provider === 'unknown') {
      this.phoneError = 'Please enter a valid MTN (6xxxxxxx) or Orange (65/68/69xxxxxx) number';
    }
    else {
      this.phoneError = '';
    }
    
    this.cdr.detectChanges();
  }

  onPhoneNumberChange() {
    this.detectAndSetProvider();
  }

  //  VALIDATE PHONE NUMBER BEFORE PAYMENT
  validatePhoneNumberBeforePayment(): string | null {
    const phone = this.shippingDetails.phoneNumber.trim();
    
    if (!phone) {
      return 'Phone number is required';
    }
    
    if (phone.length !== 9) {
      return 'Phone number must be 9 digits (e.g., 670000000)';
    }
    
    const provider = this.detectProvider(phone);
    
    if (provider === 'mtn' || provider === 'orange') {
      return null;
    }
    
    return 'Please enter a valid MTN or Orange Cameroon number';
  }

  isFormValid(): boolean {
    const phoneValid = this.validatePhoneNumberBeforePayment() === null;
    return !!(
      this.shippingDetails.fullName &&
      this.shippingDetails.phoneNumber &&
      this.shippingDetails.deliveryAddress &&
      this.shippingDetails.city &&
      phoneValid
    );
  }

  //  GENERATE LOCAL ORDER ID (No API call)
  generateLocalOrderId(): number {
    return Date.now();
  }

  //  INITIATE PAYMENT DIRECTLY (NO ORDER CREATION)
  initiateMobilePayment() {
    // Validate form
    if (!this.isFormValid()) {
      const phoneError = this.validatePhoneNumberBeforePayment();
      if (phoneError) {
        alert(phoneError);
      } else {
        alert('Please fill in all required fields');
      }
      return;
    }
    
    this.isProcessing = true;
    this.cdr.detectChanges();
    
    // Generate local order ID (no backend call!)
    const localOrderId = this.generateLocalOrderId();
    console.log('Local order ID generated:', localOrderId);
    
    // Determine provider for display
    const provider = this.detectProvider(this.shippingDetails.phoneNumber);
    const providerName = provider === 'mtn' ? 'MTN' : 'Orange';
    
    // Call CamPay payment directly
    this.paymentService.initiateMobilePayment({
      amount: this.total,
      phone_number: this.shippingDetails.phoneNumber,
      payment_method: this.selectedPayment.id,
      order_id: localOrderId
    }).subscribe({
      next: (response: any) => {
        console.log('Payment response:', response);
        
        if (response.success) {
          this.paymentReference = response.reference;
          
          alert(`✅ Payment initiated!\n\n📱 ${providerName}: ${this.shippingDetails.phoneNumber}\n💰 Amount: ${this.total} CFA\n📝 Order Ref: #${localOrderId}\n\n🔐 Please check your phone and enter your PIN when prompted.\n\n⏳ Payment will be confirmed within 30 seconds.`);
          
          // Start polling for payment status
          this.pollPaymentStatus(response.reference, localOrderId);
        } else {
          alert(`❌ Payment failed: ${response.message}`);
          this.isProcessing = false;
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.error('Payment error:', error);
        alert('Failed to initiate payment. Please try again.');
        this.isProcessing = false;
        this.cdr.detectChanges();
      }
    });
  }

  //  Poll for payment status
  pollPaymentStatus(reference: string, orderId: number) {
    let attempts = 0;
    const maxAttempts = 10; // 10 attempts = 30 seconds
    
    const interval = setInterval(() => {
      attempts++;
      console.log(`Checking payment status... Attempt ${attempts}`);
      
      this.paymentService.checkPaymentStatus(reference).subscribe({
        next: (response: any) => {
          console.log(`Status check #${attempts}:`, response.status);
          
          if (response.status === 'successful') {
            clearInterval(interval);
            this.isProcessing = false;
            this.cdr.detectChanges();
            alert('✅ Payment successful! Your order has been confirmed.');
            this.router.navigate(['/order-confirmation', orderId]);
          } 
          else if (response.status === 'failed') {
            clearInterval(interval);
            this.isProcessing = false;
            this.cdr.detectChanges();
            alert('❌ Payment failed. Please try again.');
          }
          else if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.isProcessing = false;
            this.cdr.detectChanges();
            alert('⏰ Payment timeout. Please contact support if amount was deducted.');
          }
        },
        error: (error: any) => {
          console.error('Status check error:', error);
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            this.isProcessing = false;
            this.cdr.detectChanges();
          }
        }
      });
    }, 3000);
  }

  //  Main place order method
  placeOrder() {
    if (this.selectedPayment.id === 'mobile_money' || this.selectedPayment.id === 'orange_money') {
      this.initiateMobilePayment();
    } else {
      alert('Please select a payment method');
    }
  }

  goBackToCart() {
    this.router.navigate(['/cart']);
  }

  retryLoading() {
    this.loadAllData();
  }
}