import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../core/services/product';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetail implements OnInit {
  
  product: Product | null = null;
  relatedProducts: Product[] = [];
  quantity: number = 1;
  selectedImage: string = '';
  wishlisted: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  userId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    
    console.log('Product ID from URL:', productId);
    console.log('User ID:', this.userId);
    
    if (productId) {
      this.loadAllData(productId);
    } else {
      this.errorMessage = 'Product not found';
      this.isLoading = false;
    }
  }

  loadAllData(productId: number) {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Starting forkJoin for product ID:', productId);

    // Test each API call individually first
    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        console.log('✅ getProduct SUCCESS:', product?.name);
      },
      error: (err) => {
        console.error('❌ getProduct FAILED:', err);
      }
    });

    this.productService.getProducts().subscribe({
      next: (products) => {
        console.log('✅ getProducts SUCCESS:', products?.length, 'products');
      },
      error: (err) => {
        console.error('❌ getProducts FAILED:', err);
      }
    });

    // Create requests
    const requests: any = {
      product: this.productService.getProduct(productId),
      allProducts: this.productService.getProducts()
    };
    
    // Add cart request if user is logged in
    if (this.userId) {
      requests.cart = this.cartService.getCart(this.userId);
    }

    console.log('Executing forkJoin with requests:', Object.keys(requests));

    // Load EVERYTHING at once with forkJoin
    forkJoin(requests).subscribe({
      next: (results: any) => {
        console.log('✅ forkJoin SUCCESS!', results);
        
        // Product details
        this.product = results.product;
        this.selectedImage = results.product.image_url;
        
        // Related products (from same category)
        const allProducts = results.allProducts;
        this.relatedProducts = allProducts
          .filter((p: Product) => p.category === this.product?.category && p.id !== this.product?.id)
          .slice(0, 4);
        
        this.isLoading = false;
        console.log('Product loaded:', this.product?.name);
        console.log('Related products:', this.relatedProducts.length);
      },
      error: (error) => {
        console.error('❌ forkJoin FAILED:', error);
        this.errorMessage = 'Unable to load product details. Please try again.';
        this.isLoading = false;
        
        // Try to load just the product if forkJoin fails
        this.productService.getProduct(productId).subscribe({
          next: (product) => {
            console.log('✅ Fallback: Product loaded individually');
            this.product = product;
            this.selectedImage = product.image_url;
            this.errorMessage = '';
          },
          error: (err) => {
            console.error('❌ Fallback also failed:', err);
            this.errorMessage = 'Product not found';
          }
        });
      }
    });
  }

  retryLoading() {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (productId) {
      this.loadAllData(productId);
    }
  }

  selectImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }

  increaseQty() {
    this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
      if (this.authService.isTokenExpired()) {
        alert('Session expired. Please login again.');
        this.authService.logout();
        this.router.navigate(['/login']);
        return;
      }
    
    const userId = this.authService.getUserId();
    
    if (!userId) {
      alert('User ID not found. Please login again.');
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.product) {
      alert('Product not found');
      return;
    }
    
    console.log('Adding to cart:', {
      userId: userId,
      productId: this.product.id,
      quantity: this.quantity,
      productName: this.product.name
    });
    
    this.cartService.addToCart(userId, this.product.id, this.quantity).subscribe({
      next: (response) => {
        console.log('Cart response:', response);
        alert(`${this.product?.name} added to cart!`);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart. Please try again.');
      }
    });
  }

  buyNow() {
    this.addToCart();
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 500);
  }

  toggleWishlist() {
    this.wishlisted = !this.wishlisted;
  }

  goToProduct(productId: number) {
    this.router.navigate(['/product-detail', productId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}