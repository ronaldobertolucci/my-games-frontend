import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

// Apenas os endpoints relativos
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
] as const;

// Função helper para verificar rotas públicas
function isPublicRoute(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => 
    url.includes(`${environment.apiUrl}${endpoint}`)
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  if (isPublicRoute(req.url)) {
    return next(req);
  }

  const token = localStorage.getItem('token');

  if (!token) {
    return next(req);
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.navigate(['/login']);
    return next(req);
  }

  const cloned = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  
  return next(cloned);
};

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    
    return now >= expirationTime;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return true;
  }
}