import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals para estado reativo
  registerData = signal<RegisterRequest>({
    username: '',
    password: ''
  });
  confirmPassword = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    // Limpar mensagens
    this.errorMessage.set('');
    this.successMessage.set('');

    const data = this.registerData();
    const confirm = this.confirmPassword();

    // Validações
    if (!data.username || !data.password) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return;
    }

    if (!this.isValidEmail(data.username)) {
      this.errorMessage.set('Por favor, insira um e-mail válido');
      return;
    }

    if (data.password.length < 6) {
      this.errorMessage.set('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (data.password !== confirm) {
      this.errorMessage.set('As senhas não coincidem');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(data)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Cadastro realizado com sucesso! Redirecionando...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('Erro no registro:', error);
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  // Helpers para atualizar campos
  updateUsername(username: string): void {
    this.registerData.update(d => ({ ...d, username }));
  }

  updatePassword(password: string): void {
    this.registerData.update(d => ({ ...d, password }));
  }

  updateConfirmPassword(password: string): void {
    this.confirmPassword.set(password);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401 || error.status === 409) {
      return 'Este e-mail já está cadastrado';
    }
    if (error.status === 0) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    if (error.status === 400) {
      return error.error?.message || 'Dados inválidos';
    }
    return error.error?.message || 'Erro ao realizar cadastro. Tente novamente.';
  }
}