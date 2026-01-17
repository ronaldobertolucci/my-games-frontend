import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
  @Input() message: string = '';
  @Input() type: ToastType = 'success';
  @Input() duration: number = 3000; // 3 segundos
  @Input() show: boolean = false;
  @Output() showChange = new EventEmitter<boolean>();

  ngOnInit(): void {
    if (this.show) {
      this.autoClose();
    }
  }

  ngOnChanges(): void {
    if (this.show) {
      this.autoClose();
    }
  }

  close(): void {
    this.show = false;
    this.showChange.emit(false);
  }

  private autoClose(): void {
    setTimeout(() => {
      this.close();
    }, this.duration);
  }

  getIcon(): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[this.type];
  }
}