import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access when user is authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(false);
    expect(authServiceMock.isAuthenticated).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to login page with correct path', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);

    TestBed.runInInjectionContext(() => authGuard());

    expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle multiple guard executions correctly', () => {
    // Primeira execução - não autenticado
    authServiceMock.isAuthenticated.and.returnValue(false);
    let result1 = TestBed.runInInjectionContext(() => authGuard());
    expect(result1).toBe(false);

    // Limpar chamadas anteriores
    authServiceMock.isAuthenticated.calls.reset();
    routerMock.navigate.calls.reset();

    // Segunda execução - autenticado
    authServiceMock.isAuthenticated.and.returnValue(true);
    let result2 = TestBed.runInInjectionContext(() => authGuard());
    expect(result2).toBe(true);

    expect(authServiceMock.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});