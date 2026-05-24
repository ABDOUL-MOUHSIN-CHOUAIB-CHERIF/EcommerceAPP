// src/app/core/services/cart-refresh.service.ts

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartRefreshService {
  private refreshCartSubject = new Subject<void>();
  private refreshNavbarSubject = new Subject<number>();
  
  // Observable for cart page refresh
  refreshCart$ = this.refreshCartSubject.asObservable();
  
  // Observable for navbar cart count refresh
  refreshNavbar$ = this.refreshNavbarSubject.asObservable();
  
  // Call this when cart is updated (add, remove, update quantity)
  triggerCartRefresh() {
    console.log('🔄 Cart refresh triggered');
    this.refreshCartSubject.next();
  }
  
  // Call this to update navbar cart count
  triggerNavbarRefresh(cartCount: number) {
    console.log('🔄 Navbar refresh triggered with count:', cartCount);
    this.refreshNavbarSubject.next(cartCount);
  }
}