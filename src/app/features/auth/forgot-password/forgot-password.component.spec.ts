import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['forgotPassword']);

    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    routerSpyObj.events = new Subject();

    const activatedRouteMock = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get') // sem retornar valor
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent], // ou ResetPasswordComponent
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ForgotPasswordComponent); // ou ResetPasswordComponent
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty email and no messages', () => {
    expect(component.email()).toBe('');
    expect(component.errorMessage()).toBe('');
    expect(component.successMessage()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  describe('updateEmail', () => {
    it('should update email signal', () => {
      component.updateEmail('test@example.com');
      expect(component.email()).toBe('test@example.com');
    });
  });

  describe('Form Rendering', () => {
    it('should render email input field', () => {
      const emailInput = fixture.debugElement.query(By.css('#email'));
      expect(emailInput).toBeTruthy();
    });

    it('should render submit button', () => {
      const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitButton).toBeTruthy();
    });

    it('should display error message when present', () => {
      component.errorMessage.set('Test error');
      fixture.detectChanges();

      const errorDiv = fixture.debugElement.query(By.css('.error-message'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent.trim()).toBe('Test error');
    });

    it('should display success message when present', () => {
      component.successMessage.set('Success!');
      fixture.detectChanges();

      const successDiv = fixture.debugElement.query(By.css('.success-message'));
      expect(successDiv).toBeTruthy();
    });
  });

  describe('onSubmit - Validations', () => {
    it('should show error when email is empty', () => {
      component.email.set('');
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, informe seu e-mail');
      expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
    });

    it('should show error when email is only whitespace', () => {
      component.email.set('   ');
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, informe seu e-mail');
      expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
    });

    it('should show error when email is invalid', () => {
      component.email.set('invalid-email');
      component.onSubmit();

      expect(component.errorMessage()).toBe('Por favor, informe um e-mail válido');
      expect(authServiceSpy.forgotPassword).not.toHaveBeenCalled();
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.com'
      ];

      authServiceSpy.forgotPassword.and.returnValue(of('Success'));

      validEmails.forEach(email => {
        component.email.set(email);
        component.onSubmit();
        expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith(email);
      });
    });
  });

  describe('onSubmit - Success', () => {
    it('should show success message and clear email on successful submission', fakeAsync(() => {
      const email = 'test@example.com';
      component.email.set(email);
      authServiceSpy.forgotPassword.and.returnValue(of('Email sent'));

      // Antes de submeter
      expect(component.isLoading()).toBe(false);
      expect(component.successMessage()).toBe('');

      component.onSubmit();

      // Durante o request (opcional verificar)
      // expect(component.isLoading()).toBe(true); // Pode falhar devido ao timing

      tick(); // Aguarda o Observable completar

      // Depois do request
      expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith(email);
      expect(component.successMessage()).toBe('Instruções enviadas para seu e-mail! Verifique sua caixa de entrada.');
      expect(component.email()).toBe('');
      expect(component.errorMessage()).toBe('');
      expect(component.isLoading()).toBe(false);
    }));

    it('should clear previous error messages on new submission', fakeAsync(() => {
      component.email.set('test@example.com');
      component.errorMessage.set('Previous error');
      authServiceSpy.forgotPassword.and.returnValue(of('Success'));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('');
      expect(component.successMessage()).toBeTruthy();
    }));
  });

  describe('onSubmit - Error Handling', () => {
    it('should show error message when email is not found (404)', fakeAsync(() => {
      const email = 'notfound@example.com';
      component.email.set(email);

      const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('E-mail não encontrado');
      expect(component.successMessage()).toBe('');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show connection error when status is 0', fakeAsync(() => {
      const email = 'test@example.com';
      component.email.set(email);

      const error = new HttpErrorResponse({ status: 0 });
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Erro de conexão. Verifique sua internet.');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show generic error for unknown errors', fakeAsync(() => {
      const email = 'test@example.com';
      component.email.set(email);

      const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Erro ao solicitar redefinição. Tente novamente.');
      expect(component.isLoading()).toBe(false);
    }));

    it('should show custom error message if provided', fakeAsync(() => {
      const email = 'test@example.com';
      component.email.set(email);

      const error = new HttpErrorResponse({
        status: 400,
        error: { message: 'Custom error message' }
      });
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.errorMessage()).toBe('Custom error message');
    }));
  });

  describe('Loading State', () => {
    it('should set loading to true during request', () => {
      component.email.set('test@example.com');
      authServiceSpy.forgotPassword.and.returnValue(of('Success'));

      spyOn(component.isLoading, 'set');

      component.onSubmit();

      expect(component.isLoading.set).toHaveBeenCalledWith(true);
    });

    it('should set loading to false after successful request', fakeAsync(() => {
      component.email.set('test@example.com');
      authServiceSpy.forgotPassword.and.returnValue(of('Success'));

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should set loading to false after failed request', fakeAsync(() => {
      component.email.set('test@example.com');
      const error = new HttpErrorResponse({ status: 500 });
      authServiceSpy.forgotPassword.and.returnValue(throwError(() => error));

      component.onSubmit();
      tick();

      expect(component.isLoading()).toBe(false);
    }));

    it('should disable submit button when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const submitButton: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
      expect(submitButton.disabled).toBe(true);
    });
  });
});