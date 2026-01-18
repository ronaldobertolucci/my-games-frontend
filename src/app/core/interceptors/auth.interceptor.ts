import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Lista de rotas públicas que NÃO devem ter o token
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
  ];

  // Verifica se a requisição é para uma rota pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Se for rota pública, não adiciona o token
  if (isPublicRoute) {
    return next(req);
  }

  // Para rotas protegidas, adiciona o token se existir e for válido
  const token = localStorage.getItem('token');

  if (token) {
    // Verifica se o token está expirado
    if (isTokenExpired(token)) {
      // Token expirado - limpa o storage
      localStorage.removeItem('token');
      
      // Redireciona para login
      const router = inject(Router);
      router.navigate(['/login']);
      
      return next(req);
    }

    // Token válido - adiciona no header
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};

/**
 * Verifica se o token JWT está expirado
 * @param token Token JWT
 * @returns true se expirado, false caso contrário
 */
function isTokenExpired(token: string): boolean {
  try {
    // Decodifica o payload do JWT (parte do meio)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Verifica se tem a propriedade 'exp' (expiration)
    if (!payload.exp) {
      return true;
    }

    // Converte para milissegundos e compara com a data atual
    const expirationDate = new Date(payload.exp * 1000);
    const now = new Date();
    
    return expirationDate < now;
  } catch (error) {
    // Se houver erro ao decodificar, considera como expirado
    console.error('Erro ao validar token:', error);
    return true;
  }
}