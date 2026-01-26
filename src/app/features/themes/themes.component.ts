import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { ThemeService } from '../../core/services/theme.service';
import { Theme } from '../../core/models/theme.model';
import { ThemeFormComponent } from './theme-form/theme-form.component';
import { inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-themes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableListComponent,
    ThemeFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './themes.component.html',
  styleUrls: ['./themes.component.css']
})
export class ThemesComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private themeService = inject(ThemeService);

  // Configuração da tabela (readonly)
  readonly columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Tema',
      type: 'text'
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editTheme(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deleteTheme(item) }
  ];

  // Estado usando signals
  themesData = signal<Theme[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingTheme = signal<Theme | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.loadThemes();
  }

  loadThemes(): void {
    this.isLoading.set(true);
    const searchValue = this.searchTerm().trim() || undefined;
    
    this.themeService.getThemes(this.currentPage(), this.pageSize(), searchValue)
      .subscribe({
        next: (response) => {
          this.themesData.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.number);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar temas:', error);
          this.isLoading.set(false);
          this.showToastMessage('Erro ao carregar temas', 'error');
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadThemes();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadThemes();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadThemes();
  }

  openCreateForm(): void {
    this.editingTheme.set(null);
    this.showForm.set(true);
  }

  editTheme(theme: Theme): void {
    this.editingTheme.set({ ...theme });
    this.showForm.set(true);
  }

  deleteTheme(theme: Theme): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir a tema "${theme.name}"?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.themeService.deleteTheme(theme.id!).subscribe({
          next: () => {
            this.showToastMessage('Tema excluído com sucesso!', 'success');
            this.loadThemes();
          },
          error: (error) => {
            console.error('Erro ao excluir tema:', error);
            this.showToastMessage('Erro ao excluir tema', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(theme: Theme): void {
    const isEditing = !!this.editingTheme()?.id;
    
    if (isEditing) {
      this.themeService.updateTheme(theme).subscribe({
        next: () => {
          this.showToastMessage('Tema atualizado com sucesso!', 'success');
          this.closeForm();
          this.loadThemes();
        },
        error: (error) => {
          console.error('Erro ao atualizar tema:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.themeService.createTheme(theme).subscribe({
        next: () => {
          this.showToastMessage('Tema criado com sucesso!', 'success');
          this.closeForm();
          this.loadThemes();
        },
        error: (error) => {
          console.error('Erro ao criar tema:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe um tema com este nome';
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
    this.editingTheme.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  // Helper para two-way binding do searchTerm no template
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}