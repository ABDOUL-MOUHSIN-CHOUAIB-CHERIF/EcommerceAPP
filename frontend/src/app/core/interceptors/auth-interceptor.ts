
import { HttpInterceptorFn } from '@angular/common/http';

// List of public endpoints that should NOT have Authorization header
const publicEndpoints = ['/api/register/', '/api/token/', '/api/auth/google/'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // Skip adding token for public endpoints
  const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (token && !isPublic) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};