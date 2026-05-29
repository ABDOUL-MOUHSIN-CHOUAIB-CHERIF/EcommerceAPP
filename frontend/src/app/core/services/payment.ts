
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  initiateMobilePayment(paymentData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/payments/initiate-mobile/`,
      paymentData,
      { headers: this.getAuthHeaders() }
    );
  }

  checkPaymentStatus(reference: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/payments/status/${reference}/`,
      { headers: this.getAuthHeaders() }
    );
  }
}