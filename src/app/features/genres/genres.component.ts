import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { GenreService } from '../../core/services/genre.service';
import { Genre } from '../../core/models/genre.model';
import { GenreFormComponent } from './genre-form/genre-form.component';
import { inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-genres',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableListComponent,
    GenreFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './genres.component.html',
  styleUrls: ['./genres.component.css']
})
export class GenresComponent implements OnInit {
  private confirmService = inject(ConfirmService);
  private genreService = inject(GenreService);

  // Configuração da tabela (readonly)
  readonly columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Gênero',
      type: 'text'
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editGenre(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deleteGenre(item) }
  ];

  // Estado usando signals
  genresData = signal<Genre[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingGenre = signal<Genre | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.loadGenres();
  }

  loadGenres(): void {
    this.isLoading.set(true);
    const searchValue = this.searchTerm().trim() || undefined;
    
    this.genreService.getGenres(this.currentPage(), this.pageSize(), searchValue)
      .subscribe({
        next: (response) => {
          this.genresData.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.number);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar gêneros:', error);
          this.isLoading.set(false);
          this.showToastMessage('Erro ao carregar gêneros', 'error');
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadGenres();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadGenres();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadGenres();
  }

  openCreateForm(): void {
    this.editingGenre.set(null);
    this.showForm.set(true);
  }

  editGenre(genre: Genre): void {
    this.editingGenre.set({ ...genre });
    this.showForm.set(true);
  }

  deleteGenre(genre: Genre): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir a gênero "${genre.name}"?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.genreService.deleteGenre(genre.id!).subscribe({
          next: () => {
            this.showToastMessage('Gênero excluído com sucesso!', 'success');
            this.loadGenres();
          },
          error: (error) => {
            console.error('Erro ao excluir gênero:', error);
            this.showToastMessage('Erro ao excluir gênero', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(genre: Genre): void {
    const isEditing = !!this.editingGenre()?.id;
    
    if (isEditing) {
      this.genreService.updateGenre(genre).subscribe({
        next: () => {
          this.showToastMessage('Gênero atualizado com sucesso!', 'success');
          this.closeForm();
          this.loadGenres();
        },
        error: (error) => {
          console.error('Erro ao atualizar gênero:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.genreService.createGenre(genre).subscribe({
        next: () => {
          this.showToastMessage('Gênero criado com sucesso!', 'success');
          this.closeForm();
          this.loadGenres();
        },
        error: (error) => {
          console.error('Erro ao criar gênero:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe um gênero com este nome';
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
    this.editingGenre.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  // Helper para two-way binding do searchTerm no template
  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}