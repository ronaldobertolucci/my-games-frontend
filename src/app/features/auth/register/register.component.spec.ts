import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let consoleErrorSpy: jasmine.Spy;  // Adicione esta linha

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['register']);
    consoleErrorSpy = spyOn(console, 'error');  // Adicione esta linha

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.registerData().username).toBe('');
    expect(component.registerData().password).toBe('');
    expect(component.errorMessage()).toBe('');
    expect(component.isLoading()).toBe(false);
  });

  it('should show error when fields are empty', () => {
    component.onSubmit();
    expect(component.errorMessage()).toBe('Por favor, preencha todos os campos');
  });

  it('should show error for invalid email', () => {
    component.updateUsername('invalid');
    component.updatePassword('password123');
    component.updateConfirmPassword('password123');
    
    component.onSubmit();
    
    expect(component.errorMessage()).toBe('Por favor, insira um e-mail válido');
  });

  it('should show error for short password', () => {
    component.updateUsername('test@example.com');
    component.updatePassword('12345');
    component.updateConfirmPassword('12345');
    
    component.onSubmit();
    
    expect(component.errorMessage()).toBe('A senha deve ter no mínimo 6 caracteres');
  });

  it('should show error when passwords do not match', () => {
    component.updateUsername('test@example.com');
    component.updatePassword('password123');
    component.updateConfirmPassword('different');
    
    component.onSubmit();
    
    expect(component.errorMessage()).toBe('As senhas não coincidem');
  });

  it('should call register service on valid submit', () => {
    authServiceMock.register.and.returnValue(of({}));
    
    component.updateUsername('test@example.com');
    component.updatePassword('password123');
    component.updateConfirmPassword('password123');
    
    component.onSubmit();
    
    expect(authServiceMock.register).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123'
    });
  });

  describe('Update helpers', () => {
    it('should update username', () => {
      component.updateUsername('test@example.com');
      expect(component.registerData().username).toBe('test@example.com');
    });

    it('should update password', () => {
      component.updatePassword('password123');
      expect(component.registerData().password).toBe('password123');
    });

    it('should update confirmPassword', () => {
      component.updateConfirmPassword('password123');
      expect(component.confirmPassword()).toBe('password123');
    });
  });

  describe('Error handling', () => {
    it('should handle duplicate email error (401)', (done) => {
      authServiceMock.register.and.returnValue(
        throwError(() => ({ status: 401 }))
      );
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.errorMessage()).toBe('Este e-mail já está cadastrado');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle duplicate email error (409)', (done) => {
      authServiceMock.register.and.returnValue(
        throwError(() => ({ status: 409 }))
      );
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.errorMessage()).toBe('Este e-mail já está cadastrado');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle connection error', (done) => {
      authServiceMock.register.and.returnValue(
        throwError(() => ({ status: 0 }))
      );
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.errorMessage()).toBe('Erro de conexão. Verifique sua internet.');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should reset isLoading on error', (done) => {
      authServiceMock.register.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Successful registration', () => {
    it('should show success message', (done) => {
      authServiceMock.register.and.returnValue(of({}));
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.successMessage()).toBe('Cadastro realizado com sucesso! Redirecionando...');
        done();
      }, 100);
    });

    it('should reset isLoading after success', (done) => {
      authServiceMock.register.and.returnValue(of({}));
      
      component.updateUsername('test@example.com');
      component.updatePassword('password123');
      component.updateConfirmPassword('password123');
      
      component.onSubmit();
      
      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Integration with template', () => {
    it('should display error message in template', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();
      
      const errorDiv = fixture.nativeElement.querySelector('.error-message');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.textContent.trim()).toBe('Test error message');
    });

    it('should display success message in template', () => {
      component.successMessage.set('Test success message');
      fixture.detectChanges();
      
      const successDiv = fixture.nativeElement.querySelector('.success-message');
      expect(successDiv).toBeTruthy();
      expect(successDiv.textContent.trim()).toBe('Test success message');
    });

    it('should disable inputs when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      
      const inputs = fixture.nativeElement.querySelectorAll('input');
      inputs.forEach((input: HTMLInputElement) => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should change button text when loading', () => {
      component.isLoading.set(false);
      fixture.detectChanges();
      let button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.textContent.trim()).toBe('Criar Conta');
      
      component.isLoading.set(true);
      fixture.detectChanges();
      button = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(button.textContent.trim()).toBe('Cadastrando...');
    });
  });

  describe('Email validation', () => {
    it('should accept valid email formats', () => {
      authServiceMock.register.and.returnValue(of({}));
      
      const validEmails = [
        'test@example.com',
        'user.name@domain.co',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        component.updateUsername(email);
        component.updatePassword('password123');
        component.updateConfirmPassword('password123');
        
        component.onSubmit();
        
        expect(component.errorMessage()).not.toBe('Por favor, insira um e-mail válido');
        authServiceMock.register.calls.reset();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com'
      ];

      invalidEmails.forEach(email => {
        component.updateUsername(email);
        component.updatePassword('password123');
        component.updateConfirmPassword('password123');
        
        component.onSubmit();
        
        expect(component.errorMessage()).toBe('Por favor, insira um e-mail válido');
        expect(authServiceMock.register).not.toHaveBeenCalled();
        authServiceMock.register.calls.reset();
      });
    });
  });
});