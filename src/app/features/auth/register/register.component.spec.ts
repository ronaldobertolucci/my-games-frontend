import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['register']);

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
    expect(component.registerData.username).toBe('');
    expect(component.registerData.password).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should show error when fields are empty', () => {
    component.onSubmit();
    expect(component.errorMessage).toBe('Por favor, preencha todos os campos');
  });

  it('should show error when passwords do not match', () => {
    component.registerData = {
      username: 'testuser',
      password: 'password123'
    };
    component.confirmPassword = 'differentpassword';

    component.onSubmit();
    expect(component.errorMessage).toBe('As senhas não coincidem');
  });

  it('should show error for short password', () => {
    component.registerData = {
      username: 'testuser',
      password: '123'
    };
    component.confirmPassword = '123';

    component.onSubmit();
    expect(component.errorMessage).toBe('A senha deve ter no mínimo 6 caracteres');
  });
});