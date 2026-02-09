import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  token = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  isValidatingToken = signal<boolean>(true);
  tokenIsValid = signal<boolean>(false);

  ngOnInit(): void {
    // Pega o token da URL
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    
    if (!tokenParam) {
      this.errorMessage.set('Token não fornecido');
      this.isValidatingToken.set(false);
      return;
    }

    this.token.set(tokenParam);
    this.validateToken(tokenParam);
  }

  private validateToken(token: string): void {
    this.authService.validateResetToken(token)
      .pipe(
        finalize(() => this.isValidatingToken.set(false))
      )
      .subscribe({
        next: () => {
          this.tokenIsValid.set(true);
        },
        error: (error) => {
          console.error('Erro ao validar token:', error);
          this.errorMessage.set('Token inválido ou expirado');
          this.tokenIsValid.set(false);
        }
      });
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const newPwd = this.newPassword().trim();
    const confirmPwd = this.confirmPassword().trim();

    if (!newPwd || !confirmPwd) {
      this.errorMessage.set('Por favor, preencha todos os campos');
      return;
    }

    if (newPwd.length < 6) {
      this.errorMessage.set('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPwd !== confirmPwd) {
      this.errorMessage.set('As senhas não coincidem');
      return;
    }

    this.isLoading.set(true);

    this.authService.resetPassword(this.token(), newPwd)
      .pipe(
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Senha redefinida com sucesso!');
          // Redireciona para login após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('Erro ao resetar senha:', error);
          this.errorMessage.set(this.getErrorMessage(error));
        }
      });
  }

  updateNewPassword(password: string): void {
    this.newPassword.set(password);
  }

  updateConfirmPassword(password: string): void {
    this.confirmPassword.set(password);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 400) {
      return 'Token inválido ou expirado';
    }
    if (error.status === 0) {
      return 'Erro de conexão. Verifique sua internet.';
    }
    return error.error?.message || 'Erro ao redefinir senha. Tente novamente.';
  }
}