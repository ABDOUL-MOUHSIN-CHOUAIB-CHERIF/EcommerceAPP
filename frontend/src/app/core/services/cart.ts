import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;  

  constructor(
    private http: HttpClient, 
    private authService: AuthService  
  ) {} 

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getCart(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}cart/${userId}/`, {
      headers: this.getAuthHeaders()
    });
  }

  addToCart(userId: number, productId: number, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}cart/${userId}/`, 
      { product: productId, quantity: quantity },
      { headers: this.getAuthHeaders() }
    );
  }

  updateCartItem(itemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}cart-item/${itemId}/`, 
      { quantity: quantity },
      { headers: this.getAuthHeaders() }
    );
  }

  removeCartItem(itemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}cart-item/${itemId}/`, {
      headers: this.getAuthHeaders()
    });
  }

  checkout(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}checkout/${userId}/`, 
      {},
      { headers: this.getAuthHeaders() }
    );
  }


getProductImage(item: any): string {
  if (item.productImage && item.productImage !== '') {
    return item.productImage;
  }
  return 'https://picsum.photos/80/80?random=' + (item.id || 1);
}
}