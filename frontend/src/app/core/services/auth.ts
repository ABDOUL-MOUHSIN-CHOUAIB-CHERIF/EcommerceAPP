import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = environment.apiUrl;  

  constructor(private http: HttpClient) {} 

  // LOGIN
  login(data: any): Observable<any> {
    return this.http.post(
      `${this.API_URL}token/`,  
      data
    );
  }

  // REGISTER
  register(data: any): Observable<any> {
    return this.http.post(
      `${this.API_URL}register/`,  
      data
    );
  }

  // SAVE TOKEN
  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      console.log('Token exists:', !!token);
      return token;
    }
    return null;
  }

  // LOGOUT
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  }

  // CHECK LOGIN
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // AUTH HEADERS
  getAuthHeaders() {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // PROFILE
  getProfile(): Observable<any> {
    return this.http.get(
      `${this.API_URL}profile/`,  
      this.getAuthHeaders()
    );
  }

  // GET USER ID FROM TOKEN
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const decoded: any = jwtDecode(token);
      return decoded.user_id;
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  }

  // Check if token expired
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Auto logout if token expired
  checkTokenAndLogout() {
    if (this.isTokenExpired()) {
      this.logout();
      return true;
    }
    return false;
  }
}