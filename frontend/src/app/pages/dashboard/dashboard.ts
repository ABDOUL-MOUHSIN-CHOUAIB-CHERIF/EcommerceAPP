import { Component, OnInit } from '@angular/core';
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
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.errorMessage = '';

    const userId = this.authService.getUserId();
    
    // Create array of observables to load in parallel
    const requests: any = {
      products: this.productService.getProducts()
    };
    
    // Add cart request if user is logged in
    if (userId) {
      requests.cart = this.cartService.getCart(userId);
      requests.profile = this.authService.getProfile();
    }
    
    // Load EVERYTHING at once with forkJoin
    forkJoin(requests).subscribe({
      next: (results: any) => {
        // Products always load
        this.products = results.products;
        
        // Cart count (if user logged in)
        if (results.cart) {
          const cartItems = results.cart.items || [];
          this.cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
        }
        
        // User profile (if logged in)
        if (results.profile) {
          this.userProfile = results.profile;
        }
        
        this.loading = false;
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
        
        // Try to load at least products even if other requests fail
        this.productService.getProducts().subscribe({
          next: (products) => {
            this.products = products;
            this.errorMessage = '';
          }
        });
      }
    });
  }

  retryLoading() {
    this.loadAllData();
  }
}