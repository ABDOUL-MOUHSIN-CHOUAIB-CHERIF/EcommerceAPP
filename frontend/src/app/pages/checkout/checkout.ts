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
import { PaymentService } from '../../core/services/payment.service';

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
    { id: 'card', name: 'Credit / Debit Card', description: 'Visa, Mastercard', icon: '💳', selected: false }
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
        const rawCartItems = cartResponse.items || [];

        if (rawCartItems.length === 0) {
          this.cartItems = [];
          this.calculateAll();
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        let loadedCount = 0;
        const tempItems: any[] = [];

        rawCartItems.forEach((item: any, index: number) => {
          this.productService.getProduct(item.product).subscribe({
            next: (product: any) => {
              tempItems[index] = {
                id: item.id,
                quantity: item.quantity,
                product: product
              };
              loadedCount++;

              if (loadedCount === rawCartItems.length) {
                this.cartItems = tempItems;
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
              }
            },
            error: (error: any) => {
              console.error('Error loading product:', error);
              tempItems[index] = {
                id: item.id,
                quantity: item.quantity,
                product: { name: 'Product Unavailable', price: 0, image_url: '', category: 'Unknown' }
              };
              loadedCount++;

              if (loadedCount === rawCartItems.length) {
                this.cartItems = tempItems;
                this.calculateAll();
                this.isLoading = false;
                this.cdr.detectChanges();
              }
            }
          });
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

  isFormValid(): boolean {
    return !!(
      this.shippingDetails.fullName &&
      this.shippingDetails.phoneNumber &&
      this.shippingDetails.deliveryAddress &&
      this.shippingDetails.city
    );
  }

  // ✅ Validate phone number based on payment method
  validatePhoneNumber(): string | null {
    const phone = this.shippingDetails.phoneNumber.trim();
    
    if (this.selectedPayment.id === 'mobile_money') {
      // MTN numbers start with 6 (but not 65 for Orange)
      if (!phone.startsWith('6')) {
        return 'MTN number must start with 6 (e.g., 670000000)';
      }
      if (phone.startsWith('65')) {
        return 'This appears to be an Orange number. Please select Orange Money instead.';
      }
      if (phone.length !== 9) {
        return 'MTN number must be 9 digits (e.g., 670000000)';
      }
    } 
    else if (this.selectedPayment.id === 'orange_money') {
      // Orange numbers start with 65
      if (!phone.startsWith('65')) {
        return 'Orange number must start with 65 (e.g., 650000000)';
      }
      if (phone.length !== 9) {
        return 'Orange number must be 9 digits (e.g., 650000000)';
      }
    }
    
    return null;
  }

  // ✅ Create order before payment
  async createOrder(): Promise<any> {
    const response = await fetch('http://localhost:8000/api/orders/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        items: this.cartItems.map((item: any) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name
        })),
        shipping: this.shippingDetails,
        delivery_method: this.selectedDelivery.name,
        payment_method: this.selectedPayment.name,
        subtotal: this.subtotal,
        delivery_price: this.deliveryPrice,
        total_amount: this.total
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    
    return response.json();
  }

  // ✅ Initiate CamPay Mobile Money Payment
  initiateMobilePayment() {
    // Validate form
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate phone number
    const phoneError = this.validatePhoneNumber();
    if (phoneError) {
      alert(phoneError);
      return;
    }
    
    this.isProcessing = true;
    this.cdr.detectChanges();
    
    // Step 1: Create order
    this.createOrder().then(order => {
      console.log('Order created:', order);
      
      // Step 2: Initiate CamPay payment
      this.paymentService.initiateMobilePayment({
        amount: this.total,
        phone_number: this.shippingDetails.phoneNumber,
        payment_method: this.selectedPayment.id,
        order_id: order.id
      }).subscribe({
        next: (response: any) => {
          console.log('Payment response:', response);
          
          if (response.success) {
            this.paymentReference = response.reference;
            
            // Show success message with instructions
            alert(`✅ Payment initiated!\n\n📱 Phone: ${this.shippingDetails.phoneNumber}\n💰 Amount: ${this.total} CFA\n📝 Order: #${order.id}\n\n🔐 Please check your phone and enter your PIN when prompted.\n\n⏳ Payment will be confirmed within 30 seconds.`);
            
            // Start polling for payment status
            this.pollPaymentStatus(response.reference, order.id);
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
      
    }).catch(error => {
      console.error('Order creation error:', error);
      alert('Failed to create order. Please try again.');
      this.isProcessing = false;
      this.cdr.detectChanges();
    });
  }

  // ✅ Poll for payment status
  pollPaymentStatus(reference: string, orderId: number) {
    let attempts = 0;
    const maxAttempts = 15; // 15 attempts = 45 seconds
    
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
            alert('⏰ Payment timeout. Please check your order status later or contact support.');
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
    }, 3000); // Check every 3 seconds
  }

  // ✅ Card payment (coming soon)
  processCardPayment() {
    alert('💳 Card payment coming soon! Please use Mobile Money for now.');
  }

  // ✅ Main place order method
  placeOrder() {
    // Route to appropriate payment method
    if (this.selectedPayment.id === 'mobile_money' || this.selectedPayment.id === 'orange_money') {
      this.initiateMobilePayment();
    } else if (this.selectedPayment.id === 'card') {
      this.processCardPayment();
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