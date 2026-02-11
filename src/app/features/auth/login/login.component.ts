import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals para estado reativo
  credentials = signal<LoginRequest>({
    username: '',
    password: ''
  });
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    this.errorMessage.set('');

    const creds = this.credentials();

    if (!creds.username || !creds.password) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(creds)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/my-games']);
        },
        error: (error) => {
          console.error('Erro no login:', error);
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  // Helper para atualizar username
  updateUsername(username: string): void {
    this.credentials.update(c => ({ ...c, username }));
  }

  // Helper para atualizar password
  updatePassword(password: string): void {
    this.credentials.update(c => ({ ...c, password }));
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Usuário ou senha inválidos';
    }
    if (error.status === 0) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    return error.error?.message || 'Erro ao realizar login. Tente novamente.';
  }
}