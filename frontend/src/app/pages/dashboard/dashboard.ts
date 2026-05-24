import { Component, OnInit, ChangeDetectorRef } from '@angular/core';  // ← ADD ChangeDetectorRef
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../shared/navbar/navbar';
import { ProductService } from '../../core/services/product';
import { AuthService } from '../../core/services/auth';
import { CartService } from '../../core/services/cart';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  imports: [
    CommonModule,
    DecimalPipe,
    RouterModule,
    Navbar
  ]
})
export class Dashboard implements OnInit {

  products: any[] = [];
  userProfile: any = null;
  cartCount: number = 0;
  loading: boolean = true;
  errorMessage: string = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef  // ← ADD THIS
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();  // ← FORCE DETECTION AFTER LOADING STARTS

    const userId = this.authService.getUserId();
    
    const requests: any = {
      products: this.productService.getProducts()
    };
    
    if (userId) {
      requests.cart = this.cartService.getCart(userId);
      requests.profile = this.authService.getProfile();
    }
    
    forkJoin(requests).subscribe({
      next: (results: any) => {
        this.products = results.products;
        
        if (results.cart) {
          const cartItems = results.cart.items || [];
          this.cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        }
        
        if (results.profile) {
          this.userProfile = results.profile;
        }
        
        this.loading = false;
        this.cdr.detectChanges();  // ← CRITICAL: Force view update after data loads
        
        console.log('Dashboard loaded:', {
          products: this.products.length,
          cartCount: this.cartCount,
          user: this.userProfile?.username || 'Guest'
        });
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.errorMessage = 'Unable to load products. Please refresh the page.';
        this.loading = false;
        this.cdr.detectChanges();  // ← FORCE UPDATE ON ERROR TOO
        
        this.productService.getProducts().subscribe({
          next: (products) => {
            this.products = products;
            this.errorMessage = '';
            this.cdr.detectChanges();  // ← FORCE UPDATE AFTER RETRY
          }
        });
      }
    });
  }

  retryLoading() {
    this.loadAllData();
  }
}