import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { CartItem } from '../../models/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class Cart implements OnInit {
  
  cartItems: CartItem[] = [];
  promoCode: string = '';
  promoApplied: boolean = false;
  isLoading: boolean = true;
  userId: number | null = null;
  
  // Store calculated values to display in UI
  subtotal: number = 0;
  shipping: number = 0;
  tax: number = 0;
  discountAmount: number = 0;
  total: number = 0;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadCartItems();
    } else {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

 loadCartItems() {
  this.isLoading = true;
  this.cdr.detectChanges();
  
  console.log('Loading cart for user:', this.userId);
  
  this.cartService.getCart(this.userId!).subscribe({
    next: (response: any) => {
      console.log('🔍 FULL CART RESPONSE:', JSON.stringify(response, null, 2));
      console.log('🔍 Cart items:', response.items);
      console.log('🔍 First item structure:', response.items?.[0]);
      console.log('🔍 First item product:', response.items?.[0]?.product);
      
      this.cartItems = response.items || [];
      
      // Debug each item
      this.cartItems.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          quantity: item.quantity,
          product: item.product,
          productName: item.product?.name,
          productPrice: item.product?.price,
          productImage: item.product?.image_url
        });
      });
      
      this.calculateAll();
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error loading cart:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}

  // ← NEW: Calculate all values in one place
  calculateAll() {
    this.subtotal = this.getSubtotal();
    this.shipping = this.getShipping();
    this.tax = this.getTax();
    this.discountAmount = this.getDiscount();
    this.total = this.getTotal();
    this.cdr.detectChanges();
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getShipping(): number {
    return this.subtotal > 50000 ? 0 : 5000;
  }

  getTax(): number {
    return this.subtotal * 0.05;
  }

  getDiscount(): number {
    if (this.promoApplied && this.promoCode === 'EVEREST20') {
      return this.subtotal * 0.2;
    }
    return 0;
  }

  getTotal(): number {
    return this.subtotal + this.shipping + this.tax - this.discountAmount;
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      this.cartService.updateCartItem(item.id, newQuantity).subscribe({
        next: () => {
          item.quantity = newQuantity;
          this.calculateAll(); // ← Recalculate everything
          this.cdr.detectChanges();
        },
        error: (error) => console.error('Error updating quantity:', error)
      });
    }
  }

  removeItem(item: CartItem) {
    this.cartService.removeCartItem(item.id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.id !== item.id);
        this.calculateAll(); // ← Recalculate everything
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error removing item:', error)
    });
  }

  applyPromo() {
    if (this.promoCode === 'EVEREST20') {
      this.promoApplied = true;
      this.calculateAll(); // ← Recalculate with discount
      alert('Promo code applied! 20% discount');
    } else {
      alert('Invalid promo code');
    }
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }
}