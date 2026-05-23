import { Component, OnInit } from '@angular/core';
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
  discount: number = 0;
  isLoading: boolean = true;
  userId: number | null = null;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadCartItems();
    }
  }

  loadCartItems() {
    this.isLoading = true;
    this.cartService.getCart(this.userId!).subscribe({
      next: (response: any) => {
        this.cartItems = response.items || [];
        this.isLoading = false;
        console.log('Cart loaded:', this.cartItems);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.isLoading = false;
      }
    });
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      this.cartService.updateCartItem(item.id, newQuantity).subscribe({
        next: () => {
          item.quantity = newQuantity;
          this.calculateTotals();
        },
        error: (error) => console.error('Error updating quantity:', error)
      });
    }
  }

  removeItem(item: CartItem) {
    this.cartService.removeCartItem(item.id).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.id !== item.id);
        this.calculateTotals();
      },
      error: (error) => console.error('Error removing item:', error)
    });
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getShipping(): number {
    return this.getSubtotal() > 50000 ? 0 : 5000;
  }

  getTax(): number {
    return this.getSubtotal() * 0.05;
  }

  getDiscount(): number {
    if (this.promoApplied && this.promoCode === 'EVEREST20') {
      return this.getSubtotal() * 0.2;
    }
    return 0;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getShipping() + this.getTax() - this.getDiscount();
  }

  calculateTotals() {
    // Triggers UI update
  }

  applyPromo() {
    if (this.promoCode === 'EVEREST20') {
      this.promoApplied = true;
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