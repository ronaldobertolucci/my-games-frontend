import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const emailValue = this.email().trim();

    if (!emailValue) {
      this.errorMessage.set('Por favor, informe seu e-mail');
      return;
    }

    if (!this.isValidEmail(emailValue)) {
      this.errorMessage.set('Por favor, informe um e-mail válido');
      return;
    }

    this.isLoading.set(true);

    this.authService.forgotPassword(emailValue)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Instruções enviadas para seu e-mail! Verifique sua caixa de entrada.');
          this.email.set('');
        },
        error: (error) => {
          console.error('Erro ao solicitar reset:', error);
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  updateEmail(email: string): void {
    this.email.set(email);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'E-mail não encontrado';
    }
    if (error.status === 0) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    return error.error?.message || 'Erro ao solicitar redefinição. Tente novamente.';
  }
}