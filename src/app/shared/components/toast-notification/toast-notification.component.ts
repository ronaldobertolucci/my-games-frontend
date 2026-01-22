import { Component, input, model, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrls: ['./toast-notification.component.css']
})
export class ToastNotificationComponent implements OnInit {
  // Inputs usando signals
  message = input<string>('');
  type = input<ToastType>('success');
  duration = input<number>(3000);
  
  // Two-way binding usando model()
  show = model<boolean>(false);

  private timeoutId?: number;

  constructor() {
    // Effect para observar mudanças em show
    effect(() => {
      if (this.show()) {
        this.autoClose();
      }
    });
  }

  ngOnInit(): void {
    if (this.show()) {
      this.autoClose();
    }
  }

  close(): void {
    // Limpa timeout anterior se existir
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.show.set(false);
  }

  private autoClose(): void {
    // Limpa timeout anterior se existir
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.close();
    }, this.duration());
  }

  getIcon(): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[this.type()];
  }
}