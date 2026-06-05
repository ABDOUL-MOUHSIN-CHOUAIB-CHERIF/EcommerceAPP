// products.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { ProductService } from '../../core/services/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, Footer],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class Products implements OnInit {

  products: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private productService: ProductService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    console.log('Loading products...');

    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('Products received:', products);
        this.products = products;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Products loading error:', error);
        this.errorMessage = 'Unable to load products. Please check your connection.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  retryLoading(): void {
    this.loadProducts();
  }

  goToProduct(id: number): void {
    console.log('Navigating to product:', id);
    this.router.navigate(['/product-detail', id]);
  }
}