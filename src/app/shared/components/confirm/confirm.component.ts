import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm',
  imports: [CommonModule],
  standalone: true,
  template: `
    @if (confirmService.data(); as data) {
      <div class="modal-overlay">
        <div class="modal-card">
          <h3>{{ data.title }}</h3>
          <p>{{ data.message }}</p>
          <div class="actions">
            <button class="btn-cancel" (click)="confirmService.handleResponse(false)">Cancelar</button>
            <button class="btn-danger" (click)="confirmService.handleResponse(true)">Excluir</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm.component.css'
})
export class ConfirmComponent {
  protected confirmService = inject(ConfirmService);
}
