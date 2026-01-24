import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let routerMock: jasmine.SpyObj<Router>;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    // Suprimir console.error globalmente
    consoleErrorSpy = spyOn(console, 'error');

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

      httpClient.post(`${environment.apiUrl}/auth/login`, {}).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should not add Authorization header for register route', () => {
      const testToken = 'valid-token';
      localStorage.setItem('token', testToken);

      httpClient.post(`${environment.apiUrl}/auth/register`, {}).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should allow public routes without token', () => {
      httpClient.post(`${environment.apiUrl}/auth/login`, { username: 'test', password: 'test' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should work with full URL including base path', () => {
      const testToken = 'valid-token';
      localStorage.setItem('token', testToken);

      httpClient.post(`${environment.apiUrl}/auth/register`, {}).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });
  });

  describe('Protected Routes with Valid Token', () => {
    it('should add Authorization header for protected routes', () => {
      // Token válido que expira em 2099
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);

      req.flush({});
    });

    it('should work with different protected endpoints', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get(`${environment.apiUrl}/games`).subscribe();
      httpClient.get(`${environment.apiUrl}/companies`).subscribe();
      httpClient.post(`${environment.apiUrl}/platforms`, {}).subscribe();

      const requests = httpMock.match(req => true);

      requests.forEach(req => {
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
        req.flush({});
      });
    });

    it('should add token to any route that is not in public endpoints', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get(`${environment.apiUrl}/custom/endpoint`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/custom/endpoint`);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });

  describe('Expired Token Handling', () => {
    it('should remove expired token and redirect to login', () => {
      // Token expirado (exp no passado: 2020)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzgzNjgwMH0.test';
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      // Token E username devem ter sido removidos
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();

      // Deve ter redirecionado para login
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      // Requisição não deve ter Authorization header
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should handle token without exp field', () => {
      // Token sem campo exp (base64 válido)
      const payload = btoa(JSON.stringify({ sub: "12345", username: "testuser" }));
      const tokenWithoutExp = `header.${payload}.signature`;
      localStorage.setItem('token', tokenWithoutExp);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });

    it('should handle malformed token and log error', () => {
      const malformedToken = 'invalid-token-format';
      localStorage.setItem('token', malformedToken);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });

    it('should handle token with less than 3 parts', () => {
      const invalidToken = 'header.payload';
      localStorage.setItem('token', invalidToken);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      req.flush({});
    });
  });

  describe('No Token Scenarios', () => {
    it('should allow request without token for protected routes', () => {
      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should not redirect when no token exists', () => {
      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      expect(routerMock.navigate).not.toHaveBeenCalled();

      req.flush({});
    });
  });

  describe('Route Matching with Environment', () => {
    it('should correctly identify public routes using environment config', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      // Login deve ser público
      httpClient.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
      const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(loginReq.request.headers.has('Authorization')).toBe(false);
      loginReq.flush({});

      // Register deve ser público
      httpClient.post(`${environment.apiUrl}/auth/register`, {}).subscribe();
      const registerReq = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(registerReq.request.headers.has('Authorization')).toBe(false);
      registerReq.flush({});

      // Outras rotas devem ter token
      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();
      const platformsReq = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(platformsReq.request.headers.has('Authorization')).toBe(true);
      platformsReq.flush({});
    });

    it('should not confuse similar route names', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      // Rota que contém 'login' mas não é a rota pública
      httpClient.get(`${environment.apiUrl}/user/login-history`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/user/login-history`);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });

    it('should work with query parameters in URL', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      httpClient.get(`${environment.apiUrl}/platforms?page=0&size=10`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token', () => {
      localStorage.setItem('token', '');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    it('should handle token with invalid base64 payload and log error', () => {
      const invalidToken = 'header.invalid-base64!!!.signature';
      localStorage.setItem('token', invalidToken);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao validar token:', jasmine.any(Error));

      req.flush({});
    });

    it('should handle multiple requests with expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzgzNjgwMH0.test';
      localStorage.setItem('token', expiredToken);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req1 = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req1.flush({});

      // Após a primeira requisição, token e username foram removidos
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);

      // Segunda requisição - sem token agora
      httpClient.get(`${environment.apiUrl}/games`).subscribe();

      const req2 = httpMock.expectOne(`${environment.apiUrl}/games`);
      req2.flush({});

      // Não deve ter navegado novamente (já não tem token)
      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Token Expiration Logic', () => {
    it('should consider token expiring exactly now as expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = btoa(JSON.stringify({ exp: now }));
      const tokenExpiringNow = `header.${payload}.signature`;

      localStorage.setItem('token', tokenExpiringNow);
      localStorage.setItem('username', 'testuser');

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      // Token deve ser removido
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();

      req.flush({});
    });

    it('should accept token expiring in the future', () => {
      const oneHourFromNow = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: oneHourFromNow, username: 'test' }));
      const validToken = `header.${payload}.signature`;

      localStorage.setItem('token', validToken);

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      // Token deve ainda estar no localStorage
      expect(localStorage.getItem('token')).toBe(validToken);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });

    it('should correctly validate token expiration time', () => {
      // Token que expira em 1 segundo
      const oneSecondFromNow = Math.floor(Date.now() / 1000) + 1;
      const payload = btoa(JSON.stringify({ exp: oneSecondFromNow, username: 'test' }));
      const almostExpiredToken = `header.${payload}.signature`;

      localStorage.setItem('token', almostExpiredToken);

      httpClient.get(`${environment.apiUrl}/platforms`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);

      // Token ainda é válido
      expect(localStorage.getItem('token')).toBe(almostExpiredToken);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });

  describe('Helper Function isPublicRoute', () => {
    it('should correctly identify all public endpoints', () => {
      const publicEndpoints = [
        `${environment.apiUrl}/auth/login`,
        `${environment.apiUrl}/auth/register`
      ];

      publicEndpoints.forEach(endpoint => {
        httpClient.post(endpoint, {}).subscribe();
        const req = httpMock.expectOne(endpoint);
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
      });
    });

    it('should not match partial endpoint matches incorrectly', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMH0.test';
      localStorage.setItem('token', validToken);

      // Não deve considerar público se não for exatamente o endpoint
      httpClient.get(`${environment.apiUrl}/auth/profile`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      expect(req.request.headers.has('Authorization')).toBe(true);

      req.flush({});
    });
  });
});