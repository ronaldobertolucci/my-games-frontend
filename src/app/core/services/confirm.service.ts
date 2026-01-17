import { Injectable, signal } from '@angular/core';
import { ConfirmData } from '../models/confirm-data.model';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  // Signal para controlar se o modal aparece e os dados dele
  data = signal<ConfirmData | null>(null);
  
  // Subject para emitir a resposta (true ou false)
  private responseSubject = new Subject<boolean>();

  confirm(title: string, message: string) {
    this.data.set({ title, message });
    this.responseSubject = new Subject<boolean>(); // Reinicia o canal de resposta
    return this.responseSubject.asObservable();
  }

  handleResponse(result: boolean) {
    this.responseSubject.next(result); // Envia a resposta para quem chamou
    this.data.set(null); // Fecha o modal
    this.responseSubject.complete();
  }
}