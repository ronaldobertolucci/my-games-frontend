import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { GameService } from '../../core/services/game.service';
import { Game } from '../../core/models/game.model';
import { GameFormComponent } from './game-form/game-form.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableListComponent,
    GameFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css']
})
export class GamesComponent implements OnInit {
  private readonly confirmService = inject(ConfirmService);
  private readonly gameService = inject(GameService);

  // Configuração da tabela
  readonly columns: TableColumn[] = [
    {
      key: 'title',
      header: 'Título',
      type: 'text'
    },
    {
      key: 'company',
      header: 'Empresa',
      type: 'text',
      transform: (game) => game.company?.name || 'N/A'
    },
    {
      key: 'released_at',
      header: 'Lançamento',
      type: 'text',
      transform: (game) => {
        if (!game.released_at) return '---'; 

        const date = new Date(game.released_at+'T00:00:00-03:00');
        return isNaN(date.getTime())
          ? 'Data inválida'
          : date.toLocaleDateString('pt-BR');
      }
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editGame(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deleteGame(item) }
  ];

  // Estado usando signals
  gamesData = signal<Game[]>([]);
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingGame = signal<Game | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.loadGames();
  }

  loadGames(): void {
    this.isLoading.set(true);
    const searchValue = this.searchTerm().trim() || undefined;

    this.gameService.getGames(this.currentPage(), this.pageSize(), searchValue)
      .subscribe({
        next: (response) => {
          console.log(response.content);
          this.gamesData.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.currentPage.set(response.number);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar jogos:', error);
          this.isLoading.set(false);
          this.showToastMessage('Erro ao carregar jogos', 'error');
        }
      });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadGames();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
    this.loadGames();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadGames();
  }

  openCreateForm(): void {
    this.editingGame.set(null);
    this.showForm.set(true);
  }

  editGame(game: Game): void {
    this.editingGame.set({ ...game });
    this.showForm.set(true);
  }

  deleteGame(game: Game): void {
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente excluir o jogo "${game.title}"?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.gameService.deleteGame(game.id!).subscribe({
          next: () => {
            this.showToastMessage('Jogo excluído com sucesso!', 'success');
            this.loadGames();
          },
          error: (error) => {
            console.error('Erro ao excluir jogo:', error);
            this.showToastMessage('Erro ao excluir jogo', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(game: Game): void {
    const isEditing = !!this.editingGame()?.id;

    if (isEditing) {
      this.gameService.updateGame(game).subscribe({
        next: () => {
          this.showToastMessage('Jogo atualizado com sucesso!', 'success');
          this.closeForm();
          this.loadGames();
        },
        error: (error) => {
          console.error('Erro ao atualizar jogo:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.gameService.createGame(game).subscribe({
        next: () => {
          this.showToastMessage('Jogo criado com sucesso!', 'success');
          this.closeForm();
          this.loadGames();
        },
        error: (error) => {
          console.error('Erro ao criar jogo:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Já existe um jogo com este título';
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
    this.editingGame.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }
}