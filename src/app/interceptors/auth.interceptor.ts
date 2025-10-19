import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get the auth token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // If token exists, clone the request and add the authorization header
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  // Otherwise, proceed with the original request
  return next(req);
};