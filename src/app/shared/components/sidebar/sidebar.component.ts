import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);

  username$ = this.authService.currentUser$;

  logout(): void {
    this.confirmService.confirm(
      'Confirmar Saída',
      'Deseja realmente sair?'
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.authService.logout();
      }
    })
  }
}