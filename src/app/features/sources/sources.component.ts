import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { SourceService } from '../../core/services/source.service';
import { Source } from '../../core/models/source.model';
import { SourceFormComponent } from './source-form/source-form.component';
import { inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableListComponent,
    SourceFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './sources.component.html',
  styleUrls: ['./sources.component.css']
})
export class SourcesComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private sourceService = inject(SourceService);

  // Configuração da tabela (readonly)
  readonly columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Origem',
      type: 'text'
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editSource(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deleteSource(item) }
  ];

  // Estado usando signals
  sourcesData = signal<Source[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingSource = signal<Source | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.loadSources();
  }

  loadSources(): void {
    this.isLoading.set(true);
    const searchValue = this.searchTerm().trim() || undefined;
    
    this.sourceService.getSources(this.currentPage(), this.pageSize(), searchValue)
      .subscribe({
        next: (response) => {
          this.sourcesData.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.number);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar origens:', error);
          this.isLoading.set(false);
          this.showToastMessage('Erro ao carregar origens', 'error');
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadSources();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadSources();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSources();
  }

  openCreateForm(): void {
    this.editingSource.set(null);
    this.showForm.set(true);
  }

  editSource(source: Source): void {
    this.editingSource.set({ ...source });
    this.showForm.set(true);
  }

  deleteSource(source: Source): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir a origem "${source.name}"?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.sourceService.deleteSource(source.id!).subscribe({
          next: () => {
            this.showToastMessage('Origem excluída com sucesso!', 'success');
            this.loadSources();
          },
          error: (error) => {
            console.error('Erro ao excluir origem:', error);
            this.showToastMessage('Erro ao excluir origem', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(source: Source): void {
    const isEditing = !!this.editingSource()?.id;
    
    if (isEditing) {
      this.sourceService.updateSource(source).subscribe({
        next: () => {
          this.showToastMessage('Origem atualizada com sucesso!', 'success');
          this.closeForm();
          this.loadSources();
        },
        error: (error) => {
          console.error('Erro ao atualizar origem:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.sourceService.createSource(source).subscribe({
        next: () => {
          this.showToastMessage('Origem criada com sucesso!', 'success');
          this.closeForm();
          this.loadSources();
        },
        error: (error) => {
          console.error('Erro ao criar origem:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe uma origem com este nome';
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
    this.editingSource.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  // Helper para two-way binding do searchTerm no template
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}