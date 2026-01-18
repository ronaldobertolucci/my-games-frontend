import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Public Routes', () => {
    it('should not add Authorization header for login route', () => {
      const testToken = 'valid-token';
      localStorage.setItem('token', testToken);

      httpClient.post('/api/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should not add Authorization header for register route', () => {
      const testToken = 'valid-token';
      localStorage.setItem('token', testToken);

      httpClient.post('/api/auth/register', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should allow public routes without token', () => {
      httpClient.post('/api/auth/login', { username: 'test', password: 'test' }).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });
  });

  describe('Protected Routes with Valid Token', () => {
    it('should add Authorization header for protected routes', () => {
      // Token válido que expira em 2099
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);

      req.flush({});
    });

    it('should work with different protected endpoints', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get('/api/games').subscribe();
      httpClient.get('/api/companies').subscribe();
      httpClient.post('/api/platforms', {}).subscribe();

      const requests = httpMock.match(req => true);

      requests.forEach(req => {
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
        req.flush({});
      });
    });
  });

  describe('Expired Token Handling', () => {
    it('should remove expired token and redirect to login', () => {
      // Token expirado (exp no passado: 2020)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzgzNjgwMH0.test';
      localStorage.setItem('token', expiredToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      // Token deve ter sido removido do localStorage
      expect(localStorage.getItem('token')).toBeNull();

      // Deve ter redirecionado para login
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      // Requisição não deve ter Authorization header
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should handle token without exp field', () => {
      // Token sem campo exp
      const tokenWithoutExp = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciJ9.test';
      localStorage.setItem('token', tokenWithoutExp);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      expect(localStorage.getItem('token')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });

    it('should handle malformed token', () => {
      const malformedToken = 'invalid-token-format';
      localStorage.setItem('token', malformedToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      expect(localStorage.getItem('token')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });
  });

  describe('No Token Scenarios', () => {
    it('should allow request without token for protected routes', () => {
      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should not redirect when no token exists', () => {
      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      expect(routerMock.navigate).not.toHaveBeenCalled();

      req.flush({});
    });
  });

  describe('Route Matching', () => {
    it('should match public routes with full URLs', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.post('http://localhost:8080/api/auth/login', {}).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should not confuse similar route names', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      // Rota que contém 'login' mas não é a rota pública
      httpClient.get('/api/user/login-history').subscribe();

      const req = httpMock.expectOne('/api/user/login-history');
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token', () => {
      localStorage.setItem('token', '');

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should handle token with only two parts', () => {
      const invalidToken = 'header.payload';
      localStorage.setItem('token', invalidToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      expect(localStorage.getItem('token')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });

    it('should handle token with invalid base64 payload', () => {
      const invalidToken = 'header.invalid-base64!!!.signature';
      localStorage.setItem('token', invalidToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      expect(localStorage.getItem('token')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });

    it('should handle multiple requests with expired token by navigating only once', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzgzNjgwMH0.test';
      localStorage.setItem('token', expiredToken);

      httpClient.get('/api/platforms').subscribe({
        error: (err) => expect(err).toBeDefined()
      });
      httpClient.get('/api/platforms').subscribe({
        error: (err) => expect(err).toBeDefined()
      });

      const requests = httpMock.match(req => true);

      requests.forEach(req => req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' }));

      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Token Expiration Logic', () => {
    it('should consider token expiring exactly now as expired', () => {
      // Criar token que expira agora
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({ exp: now }));
      const tokenExpiringNow = `header.${payload}.signature`;

      localStorage.setItem('token', tokenExpiringNow);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      // Token deve ser removido
      expect(localStorage.getItem('token')).toBeNull();

      req.flush({});
    });

    it('should accept token expiring in the future', () => {
      // Token que expira daqui a 1 hora
      const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: oneHourFromNow, username: 'test' }));
      const validToken = `header.${payload}.signature`;

      localStorage.setItem('token', validToken);

      httpClient.get('/api/platforms').subscribe();

      const req = httpMock.expectOne('/api/platforms');

      // Token deve ainda estar no localStorage
      expect(localStorage.getItem('token')).toBe(validToken);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });
});