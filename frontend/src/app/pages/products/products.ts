// products.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { forkJoin } from 'rxjs';

import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';

import { ProductService } from '../../core/services/product';
import { AuthService } from '../../core/services/auth';
import { CartService } from '../../core/services/cart';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    Navbar,
    Footer
  ],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {

  products: any[] = [];

  userProfile: any = null;

  cartCount: number = 0;

  isLoading: boolean = true;

  errorMessage: string = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {

    this.isLoading = true;

    this.errorMessage = '';

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

        this.products = results.products || [];

        if (results.cart) {

          const cartItems = results.cart.items || [];

          this.cartCount = cartItems.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          );
        }

        if (results.profile) {
          this.userProfile = results.profile;
        }

        setTimeout(() => {
          this.isLoading = false;
        }, 0);

        console.log('Products loaded successfully');
      },

      error: (error) => {

        console.error('Products loading error:', error);

        this.errorMessage =
          'Unable to load products. Please check your connection.';

        this.isLoading = false;
      }
    });
  }

  retryLoading(): void {
    this.loadAllData();
  }

  goToProduct(id: number): void {

    this.router.navigate(['/product-detail', id]);
  }
}