import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, LoginResponse, RegisterRequest } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerMock: jasmine.SpyObj<Router>;

  const mockLoginRequest: LoginRequest = {
    username: 'testuser',
    password: 'password123'
  };

  const mockLoginResponse: LoginResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6OTk5OTk5OTk5OX0.test',
    username: 'testuser'
  };

  const mockRegisterRequest: RegisterRequest = {
    username: 'newuser',
    password: 'password123'
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send POST request to login endpoint', () => {
      service.login(mockLoginRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);

      req.flush(mockLoginResponse);
    });

    it('should store token and username in localStorage on successful login', (done) => {
      service.login(mockLoginRequest).subscribe(response => {
        expect(localStorage.getItem('token')).toBe(mockLoginResponse.token);
        expect(localStorage.getItem('username')).toBe(mockLoginResponse.username);
        expect(response).toEqual(mockLoginResponse);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should update currentUser$ observable on successful login', (done) => {
      service.login(mockLoginRequest).subscribe(() => {
        service.currentUser$.subscribe(username => {
          expect(username).toBe(mockLoginResponse.username);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockLoginResponse);
    });

    it('should handle login error', (done) => {
      const errorMessage = 'Invalid credentials';

      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(errorMessage, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should send POST request to register endpoint', () => {
      service.register(mockRegisterRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);

      req.flush({ message: 'User registered successfully' });
    });

    it('should handle registration error for duplicate username', (done) => {
      const errorMessage = 'Username already exists';

      service.register(mockRegisterRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush(errorMessage, { status: 401, statusText: 'Conflict' });
    });

    it('should send correct data without email field', () => {
      const registerData: RegisterRequest = {
        username: 'testuser',
        password: 'pass123'
      };

      service.register(registerData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.body).toEqual(registerData);

      req.flush({ message: 'Success' });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('username', 'testuser');
    });

    it('should clear localStorage', () => {
      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
    });

    it('should update currentUser$ to null', (done) => {
      service.logout();

      service.currentUser$.subscribe(username => {
        expect(username).toBeNull();
        done();
      });
    });

    it('should navigate to login page', () => {
      service.logout();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when valid token exists', () => {
      // Token válido com exp no futuro
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6OTk5OTk5OTk5OX0.test';
      localStorage.setItem('token', validToken);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when token is expired', () => {
      // Token expirado (exp no passado)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTUxNjIzOTAyMn0.test';
      localStorage.setItem('token', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is malformed', () => {
      localStorage.setItem('token', 'invalid-token');

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const testToken = 'test-token-12345';
      localStorage.setItem('token', testToken);

      expect(service.getToken()).toBe(testToken);
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('currentUser$ observable', () => {
    it('should emit stored username on initialization', () => {
      localStorage.setItem('username', 'storeduser');

      // Recriar o TestBed para testar inicialização com username armazenado
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          AuthService,
          { provide: Router, useValue: routerMock }
        ]
      });

      const newService = TestBed.inject(AuthService);

      // Usar firstValueFrom ou done callback
      newService.currentUser$.subscribe(username => {
        expect(username).toBe('storeduser');
      });
    });

    it('should emit null when no username is stored', (done) => {
      service.currentUser$.subscribe(username => {
        expect(username).toBeNull();
        done();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive logins', (done) => {
      const firstLogin = { ...mockLoginRequest, username: 'user1' };
      const firstResponse = { ...mockLoginResponse, username: 'user1', token: 'token1' };
      const secondLogin = { ...mockLoginRequest, username: 'user2' };
      const secondResponse = { ...mockLoginResponse, username: 'user2', token: 'token2' };

      service.login(firstLogin).subscribe(() => {
        expect(localStorage.getItem('username')).toBe('user1');

        service.login(secondLogin).subscribe(() => {
          expect(localStorage.getItem('username')).toBe('user2');
          expect(localStorage.getItem('token')).toBe('token2');
          done();
        });

        const req2 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        req2.flush(secondResponse);
      });

      const req1 = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req1.flush(firstResponse);
    });

    it('should handle logout without prior login', () => {
      expect(() => service.logout()).not.toThrow();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('forgotPassword', () => {
    it('should send POST request to /password/forgot with email', (done) => {
      const email = 'test@example.com';

      service.forgotPassword(email).subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/forgot`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email });
      expect(req.request.responseType).toBe('text');

      req.flush('Email sent');
    });

    it('should handle error when email is not found', (done) => {
      const email = 'notfound@example.com';

      service.forgotPassword(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/forgot`);
      req.flush('Email not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network error', (done) => {
      const email = 'test@example.com';

      service.forgotPassword(email).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/forgot`);
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('validateResetToken', () => {
    it('should send GET request to /password/reset/validate with token', (done) => {
      const token = 'valid-token-123';

      service.validateResetToken(token).subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset/validate?token=${token}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('token')).toBe(token);
      expect(req.request.responseType).toBe('text');

      req.flush('Valid');
    });

    it('should handle invalid token error', (done) => {
      const token = 'invalid-token';

      service.validateResetToken(token).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset/validate?token=${token}`);
      req.flush('Invalid token', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle expired token error', (done) => {
      const token = 'expired-token';

      service.validateResetToken(token).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset/validate?token=${token}`);
      req.flush('Token expired', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('resetPassword', () => {
    it('should send POST request to /password/reset with token and new password', (done) => {
      const token = 'valid-token-123';
      const newPassword = 'newPassword123';

      service.resetPassword(token, newPassword).subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token, new_password: newPassword });
      expect(req.request.responseType).toBe('text');

      req.flush('Password reset successful');
    });

    it('should handle expired token error', (done) => {
      const token = 'expired-token';
      const newPassword = 'newPassword123';

      service.resetPassword(token, newPassword).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset`);
      req.flush('Token expired', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle invalid token error', (done) => {
      const token = 'invalid-token';
      const newPassword = 'newPassword123';

      service.resetPassword(token, newPassword).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset`);
      req.flush('Invalid token', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle server error', (done) => {
      const token = 'valid-token';
      const newPassword = 'newPassword123';

      service.resetPassword(token, newPassword).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/password/reset`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});