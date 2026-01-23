import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { PlatformService } from '../../core/services/platform.service';
import { Platform } from '../../core/models/platform.model';
import { PlatformFormComponent } from './platform-form/platform-form.component';
import { inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-platforms',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableListComponent,
    PlatformFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './platforms.component.html',
  styleUrls: ['./platforms.component.css']
})
export class PlatformsComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private platformService = inject(PlatformService);

  // Configuração da tabela (readonly)
  readonly columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Plataforma',
      type: 'text'
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editPlatform(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deletePlatform(item) }
  ];

  // Estado usando signals
  platformsData = signal<Platform[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingPlatform = signal<Platform | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.loadPlatforms();
  }

  loadPlatforms(): void {
    this.isLoading.set(true);
    const searchValue = this.searchTerm().trim() || undefined;
    
    this.platformService.getPlatforms(this.currentPage(), this.pageSize(), searchValue)
      .subscribe({
        next: (response) => {
          this.platformsData.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.number);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar plataformas:', error);
          this.isLoading.set(false);
          this.showToastMessage('Erro ao carregar plataformas', 'error');
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadPlatforms();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadPlatforms();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPlatforms();
  }

  openCreateForm(): void {
    this.editingPlatform.set(null);
    this.showForm.set(true);
  }

  editPlatform(platform: Platform): void {
    this.editingPlatform.set({ ...platform });
    this.showForm.set(true);
  }

  deletePlatform(platform: Platform): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir a plataforma "${platform.name}"?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.platformService.deletePlatform(platform.id!).subscribe({
          next: () => {
            this.showToastMessage('Plataforma excluída com sucesso!', 'success');
            this.loadPlatforms();
          },
          error: (error) => {
            console.error('Erro ao excluir plataforma:', error);
            this.showToastMessage('Erro ao excluir plataforma', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(platform: Platform): void {
    const isEditing = !!this.editingPlatform()?.id;
    
    if (isEditing) {
      this.platformService.updatePlatform(platform).subscribe({
        next: () => {
          this.showToastMessage('Plataforma atualizada com sucesso!', 'success');
          this.closeForm();
          this.loadPlatforms();
        },
        error: (error) => {
          console.error('Erro ao atualizar plataforma:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.platformService.createPlatform(platform).subscribe({
        next: () => {
          this.showToastMessage('Plataforma criada com sucesso!', 'success');
          this.closeForm();
          this.loadPlatforms();
        },
        error: (error) => {
          console.error('Erro ao criar plataforma:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe uma plataforma com este nome';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Dados inválidos';
    } else {
      errorMessage = 'Erro ao processar solicitação';
    }

    this.showToastMessage(errorMessage, 'error');
  }

  private showToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingPlatform.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  // Helper para two-way binding do searchTerm no template
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}