// frontend/src/app/pages/cart/cart.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { ProductService } from '../../core/services/product';

interface CartItemDisplay {
  id: number;
  quantity: number;
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productCategory: string;
  productStock: number;  
  total: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Navbar, Footer],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class Cart implements OnInit {
  
  cartItems: CartItemDisplay[] = [];
  promoCode: string = '';
  promoApplied: boolean = false;
  isLoading: boolean = true;
  userId: number | null = null;
  
  subtotal: number = 0;
  shipping: number = 0;
  tax: number = 0;
  discountAmount: number = 0;
  total: number = 0;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
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

  // ✅ FIXED: Use product data directly from cart response - NO FETCHING NEEDED!
  loadCartItems() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    console.log('Loading cart for user:', this.userId);
    
    this.cartService.getCart(this.userId!).subscribe({
      next: (response: any) => {
        console.log('Raw cart response:', response);
        
        const rawItems = response.items || [];
        
        if (rawItems.length === 0) {
          this.cartItems = [];
          this.calculateAll();
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        // ✅ DIRECT MAPPING - product data is already in the response!
        this.cartItems = rawItems.map((item: any) => {
          // The product data is already embedded in the cart item
          const product = item.product;
          
          return {
            id: item.id,
            quantity: item.quantity,
            productId: product?.id || 0,
            productName: product?.name || 'Unknown Product',
            productPrice: product?.price || 0,
            productImage: product?.image_url || '',
            productCategory: product?.category || 'General',
            total: (product?.price || 0) * item.quantity
          };
        });
        
        console.log('✅ Cart items loaded:', this.cartItems);
        
        this.calculateAll();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading cart:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateAll() {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
    this.shipping = this.subtotal > 50000 ? 0 : 5000;
    this.tax = this.subtotal * 0.05;
    this.discountAmount = this.promoApplied && this.promoCode === 'EVEREST20' ? this.subtotal * 0.2 : 0;
    this.total = this.subtotal;
    this.cdr.detectChanges();
    
    console.log('Calculated totals:', {
      subtotal: this.subtotal,
      shipping: this.shipping,
      tax: this.tax,
      discount: this.discountAmount,
      total: this.total
    });
  }

updateQuantity(item: CartItemDisplay, change: number) {
  const newQuantity = item.quantity + change;
  
  console.log('Update quantity:', { current: item.quantity, change, new: newQuantity, stock: item.productStock });
  
  // Don't go below 1
  if (newQuantity < 1) {
    console.log('Quantity cannot be less than 1');
    return;
  }
  
  // Check stock when increasing
  if (change > 0 && newQuantity > item.productStock) {
    alert(`Sorry, only ${item.productStock} items available in stock`);
    return;
  }
  
  this.isLoading = true;
  this.cdr.detectChanges();
  
  this.cartService.updateCartItem(item.id, newQuantity).subscribe({
    next: () => {
      item.quantity = newQuantity;
      item.total = item.productPrice * newQuantity;
      this.calculateAll();
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('Quantity updated successfully');
    },
    error: (error: any) => {
      console.error('Error updating quantity:', error);
      this.isLoading = false;
      this.cdr.detectChanges();
      alert('Failed to update quantity. Please try again.');
    }
  });
}

  removeItem(item: CartItemDisplay) {
    this.cartService.removeCartItem(item.id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.id !== item.id);
        this.calculateAll();
        this.cdr.detectChanges();
      },
      error: (error: any) => console.error('Error removing item:', error)
    });
  }

  applyPromo() {
    if (this.promoCode === 'EVEREST20') {
      this.promoApplied = true;
      this.calculateAll();
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