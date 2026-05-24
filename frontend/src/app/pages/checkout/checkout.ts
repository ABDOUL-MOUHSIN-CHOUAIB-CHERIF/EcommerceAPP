import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';

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
    { id: 'mobile_money', name: 'Mobile Money', description: 'MTN MoMo or Orange Money', icon: '📱', selected: true },
    { id: 'card', name: 'Credit / Debit Card', description: 'Visa, Mastercard, or Verve', icon: '💳', selected: false }
  ];

  selectedDelivery = this.deliveryMethods[0];
  selectedPayment = this.paymentMethods[0];

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
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

  placeOrder() {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    this.isProcessing = true;
    this.cdr.detectChanges();

    this.cartService.checkout(this.userId!).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.cdr.detectChanges();
        alert('Order placed successfully!');
        this.router.navigate(['/product']);
      },
      error: (error: any) => {
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