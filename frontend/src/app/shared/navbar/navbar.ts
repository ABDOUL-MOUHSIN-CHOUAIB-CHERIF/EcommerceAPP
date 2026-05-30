
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { CartRefreshService } from '../../core/services/cart-refresh';  
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';  

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {  
  
  menuOpen = false;
  user: any;
  cartCount: number = 0;  
  private refreshSubscription: Subscription;  

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,  
    private cartRefreshService: CartRefreshService  
  ) {
    // ✅ Listen for navbar refresh events
    this.refreshSubscription = this.cartRefreshService.refreshNavbar$.subscribe((count: number) => {
      console.log(' Updating navbar cart count to:', count);
      this.cartCount = count;
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: (res) => { 
        console.log('PROFILE:', res);
        this.user = res;
        this.cdr.detectChanges();
      },
      error: () => {
        console.log('Not logged in');
      }
    });
  }
  
  ngOnDestroy() {
    // ✅ Clean up subscription
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }
  
  gotToRegister() {
    this.router.navigate(['/register'])
  }
  
  goToLogin() {
    this.router.navigate(['/login'])
  }
  
  goToProduct() {
    this.router.navigate(['/product']);
  }
  
  goToHome() {
    this.router.navigate(['/dashboard']);
  }
  
  goToCart() {
    this.router.navigate(['/cart']);
  }
  
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMenu() {
    this.menuOpen = false;
    document.body.style.overflow = '';
  }
}