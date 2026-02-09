import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['validateResetToken', 'resetPassword']);

    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpyObj.events = new Subject();

    activatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('valid-token-123')
        }
      }
    };
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit - Token Validation', () => {
    it('should validate token on initialization', fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));

      fixture.detectChanges(); // Triggers ngOnInit
      tick();

      expect(component.token()).toBe('valid-token-123');
      expect(authServiceSpy.validateResetToken).toHaveBeenCalledWith('valid-token-123');
      expect(component.tokenIsValid()).toBe(true);
      expect(component.isValidatingToken()).toBe(false);
    }));

    it('should show error when token is not provided in URL', () => {
      activatedRoute.snapshot.queryParamMap.get.and.returnValue(null);

      fixture.detectChanges();

      expect(component.errorMessage()).toBe('Token não fornecido');
      expect(component.isValidatingToken()).toBe(false);
      expect(authServiceSpy.validateResetToken).not.toHaveBeenCalled();
    });

    it('should handle invalid token', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 400 });
      authServiceSpy.validateResetToken.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(component.errorMessage()).toBe('Token inválido ou expirado');
      expect(component.tokenIsValid()).toBe(false);
      expect(component.isValidatingToken()).toBe(false);
    }));
  });

  describe('updateNewPassword and updateConfirmPassword', () => {
    it('should update newPassword signal', () => {
      component.updateNewPassword('newPass123');
      expect(component.newPassword()).toBe('newPass123');
    });

    it('should update confirmPassword signal', () => {
      component.updateConfirmPassword('confirmPass123');
      expect(component.confirmPassword()).toBe('confirmPass123');
    });
  });

  describe('Form Rendering', () => {
    beforeEach(fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));
      fixture.detectChanges();
      tick();
    }));

    it('should render password input fields when token is valid', () => {
      const newPasswordInput = fixture.debugElement.query(By.css('#newPassword'));
      const confirmPasswordInput = fixture.debugElement.query(By.css('#confirmPassword'));

      expect(newPasswordInput).toBeTruthy();
      expect(confirmPasswordInput).toBeTruthy();
    });

    it('should render submit button when token is valid', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton).toBeTruthy();
    });

    it('should not render form when token is invalid', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 400 });
      authServiceSpy.validateResetToken.and.returnValue(throwError(() => error));

      const newFixture = TestBed.createComponent(ResetPasswordComponent);
      newFixture.detectChanges();
      tick();

      const form = newFixture.debugElement.query(By.css('form'));
      expect(form).toBeFalsy();
    }));
  });

  describe('onSubmit - Validations', () => {
    beforeEach(fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));
      fixture.detectChanges();
      tick();
      component.tokenIsValid.set(true);
    }));

    it('should show error when passwords are empty', () => {
      component.newPassword.set('');
      component.confirmPassword.set('');
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, preencha todos os campos');
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', () => {
      component.newPassword.set('12345');
      component.confirmPassword.set('12345');
      component.onSubmit();

      expect(component.errorMessage()).toBe('A senha deve ter no mínimo 6 caracteres');
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should show error when passwords do not match', () => {
      component.newPassword.set('password123');
      component.confirmPassword.set('different123');
      component.onSubmit();

      expect(component.errorMessage()).toBe('As senhas não coincidem');
      expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    });

    it('should trim whitespace from passwords', () => {
      component.newPassword.set('  password123  ');
      component.confirmPassword.set('  password123  ');
      authServiceSpy.resetPassword.and.returnValue(of('Success'));

      component.onSubmit();

      expect(authServiceSpy.resetPassword).toHaveBeenCalledWith(
        component.token(),
        'password123'
      );
    });
  });

  describe('onSubmit - Success', () => {
    beforeEach(fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));
      fixture.detectChanges();
      tick();
      component.tokenIsValid.set(true);
      component.token.set('valid-token-123');
    }));

    it('should reset password successfully and redirect to login', fakeAsync(() => {
      component.newPassword.set('newPassword123');
      component.confirmPassword.set('newPassword123');
      authServiceSpy.resetPassword.and.returnValue(of('Success'));

      component.onSubmit();

      tick(); // Aguarda o Observable completar

      expect(authServiceSpy.resetPassword).toHaveBeenCalledWith('valid-token-123', 'newPassword123');
      expect(component.successMessage()).toBe('Senha redefinida com sucesso!');
      expect(component.errorMessage()).toBe('');
      expect(component.isLoading()).toBe(false);

      tick(2000); // Aguarda o setTimeout

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should clear previous error messages on new submission', fakeAsync(() => {
      component.newPassword.set('password123');
      component.confirmPassword.set('password123');
      component.errorMessage.set('Previous error');
      authServiceSpy.resetPassword.and.returnValue(of('Success'));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('');
      expect(component.successMessage()).toBeTruthy();
    }));
  });

  describe('onSubmit - Error Handling', () => {
    beforeEach(fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));
      fixture.detectChanges();
      tick();
      component.tokenIsValid.set(true);
      component.token.set('valid-token-123');
      component.newPassword.set('password123');
      component.confirmPassword.set('password123');
    }));

    it('should handle invalid/expired token error', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 400 });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Token inválido ou expirado');
      expect(component.successMessage()).toBe('');
      expect(component.isLoading()).toBe(false);
    }));

    it('should handle connection error', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 0 });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Erro de conexão. Verifique sua internet.');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show generic error for unknown errors', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 500 });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Erro ao redefinir senha. Tente novamente.');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show custom error message if provided', fakeAsync(() => {
      const error = new HttpErrorResponse({
        status: 500, // ← Mude para 500 ao invés de 400
        error: { message: 'Custom error' }
      });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Custom error');
    }));
  });

  describe('Loading State', () => {
    beforeEach(fakeAsync(() => {
      authServiceSpy.validateResetToken.and.returnValue(of('Valid'));
      fixture.detectChanges();
      tick();
      component.tokenIsValid.set(true);
      component.newPassword.set('password123');
      component.confirmPassword.set('password123');
    }));

    it('should set loading to true during request', () => {
      component.newPassword.set('password123');
      component.confirmPassword.set('password123');
      authServiceSpy.resetPassword.and.returnValue(of('Success'));

      spyOn(component.isLoading, 'set');

      component.onSubmit();

      expect(component.isLoading.set).toHaveBeenCalledWith(true);
    });

    it('should set loading to false after successful request', fakeAsync(() => {
      authServiceSpy.resetPassword.and.returnValue(of('Success'));

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should set loading to false after failed request', fakeAsync(() => {
      const error = new HttpErrorResponse({ status: 500 });
      authServiceSpy.resetPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
    }));
  });
});