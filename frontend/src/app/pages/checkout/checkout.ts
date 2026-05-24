

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';  
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';  
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { CartRefreshService } from '../../core/services/cart-refresh';  

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit, OnDestroy {  
  
  cartItems: any[] = [];
  userProfile: any = null;
  userId: number | null = null;
  isLoading: boolean = true;
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
  
  private refreshSubscription: Subscription;  
  private routeSubscription: Subscription;    
  
  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private cartRefreshService: CartRefreshService  
  ) {
    // ✅ Listen for cart refresh events
    this.refreshSubscription = this.cartRefreshService.refreshCart$.subscribe(() => {
      console.log('📢 Cart refresh received on checkout, reloading...');
      this.loadAllData();
    });
    
    // ✅ Listen for route changes
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      console.log('📍 Route changed to checkout, reloading data...');
      this.loadAllData();
    });
  }
  
  ngOnInit() {
    this.userId = this.authService.getUserId();
    
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadAllData();
  }
  
  ngOnDestroy() {
    // ✅ Clean up subscriptions
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
  
  loadAllData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    forkJoin({
      cart: this.cartService.getCart(this.userId!),
      profile: this.authService.getProfile()
    }).subscribe({
      next: (results) => {
        this.cartItems = results.cart.items || [];
        this.userProfile = results.profile;
        
        if (this.userProfile) {
          this.shippingDetails.fullName = this.userProfile.full_name || this.userProfile.username || '';
          this.shippingDetails.phoneNumber = this.userProfile.phone || '';
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
        
        console.log('✅ Checkout data loaded:', {
          cartItems: this.cartItems.length,
          userProfile: this.userProfile
        });
      },
      error: (error) => {
        console.error('❌ Error loading checkout data:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        
        this.cartService.getCart(this.userId!).subscribe({
          next: (cart) => {
            this.cartItems = cart.items || [];
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
  
  selectDelivery(method: any) {
    this.deliveryMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedDelivery = method;
    this.cdr.detectChanges();
  }
  
  selectPayment(method: any) {
    this.paymentMethods.forEach(m => m.selected = false);
    method.selected = true;
    this.selectedPayment = method;
    this.cdr.detectChanges();
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
  
  getItemTotal(item: any): number {
    return item.product.price * item.quantity;
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
    this.cdr.detectChanges();
    
    this.cartService.checkout(this.userId!).subscribe({
      next: (response) => {
        this.isProcessing = false;
        this.cdr.detectChanges();
        alert('Order placed successfully!');
        this.router.navigate(['/order-confirmation']);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.isProcessing = false;
        this.cdr.detectChanges();
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