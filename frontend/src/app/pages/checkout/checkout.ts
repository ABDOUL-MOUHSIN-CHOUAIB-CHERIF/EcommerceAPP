import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';

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
  isLoading: boolean = true;  // ← ONE loading state for EVERYTHING
  isProcessing: boolean = false;
  
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
    { id: 'mobile_money', name: 'Mobile Money', description: 'MTN MoMo or Orange Money', icon: '📱', selected: true },
    { id: 'card', name: 'Credit / Debit Card', description: 'Visa, Mastercard, or Verve', icon: '💳', selected: false }
  ];
  
  selectedDelivery = this.deliveryMethods[0];
  selectedPayment = this.paymentMethods[0];
  
  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    this.userId = this.authService.getUserId();
    
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    // ✅ LOAD EVERYTHING AT ONCE - Synchronously
    this.loadAllData();
  }
  
  loadAllData() {
    this.isLoading = true;
    
    // Use forkJoin to load ALL APIs simultaneously
    forkJoin({
      cart: this.cartService.getCart(this.userId!),
      profile: this.authService.getProfile()
    }).subscribe({
      next: (results) => {
        // Both API calls complete at the SAME time
        this.cartItems = results.cart.items || [];
        this.userProfile = results.profile;
        
        // Auto-fill shipping details from profile
        if (this.userProfile) {
          this.shippingDetails.fullName = this.userProfile.full_name || this.userProfile.username || '';
          this.shippingDetails.phoneNumber = this.userProfile.phone || '';
        }
        
        this.isLoading = false;  // ← Everything loaded, hide spinner
        console.log('All data loaded:', {
          cartItems: this.cartItems.length,
          userProfile: this.userProfile
        });
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.isLoading = false;
        
        // Still try to load cart even if profile fails
        this.cartService.getCart(this.userId!).subscribe({
          next: (cart) => {
            this.cartItems = cart.items || [];
            this.isLoading = false;
          }
        });
      }
    });
  }
  
  selectDelivery(method: any) {
    this.deliveryMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedDelivery = method;
  }
  
  selectPayment(method: any) {
    this.paymentMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedPayment = method;
  }
  
  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }
  
  getDeliveryPrice(): number {
    return this.selectedDelivery.price;
  }
  
  getTotal(): number {
    return this.getSubtotal() + this.getDeliveryPrice();
  }
  
  isFormValid(): boolean {
    return !!(
      this.shippingDetails.fullName &&
      this.shippingDetails.phoneNumber &&
      this.shippingDetails.deliveryAddress &&
      this.shippingDetails.city
    );
  }
  
  placeOrder() {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }
    
    this.isProcessing = true;
    
    this.cartService.checkout(this.userId!).subscribe({
      next: (response) => {
        this.isProcessing = false;
        alert('Order placed successfully!');
        this.router.navigate(['/order-confirmation']);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.isProcessing = false;
        alert('Failed to place order. Please try again.');
      }
    });
  }
  
  goBackToCart() {
    this.router.navigate(['/cart']);
  }
  
  retryLoading() {
    this.loadAllData();
  }
}