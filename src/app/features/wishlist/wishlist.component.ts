import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableListComponent, TableColumn, TableAction } from '../../shared/components/table-list/table-list.component';
import { MyGameService } from '../../core/services/my-game.service';
import { PlatformService } from '../../core/services/platform.service';
import { SourceService } from '../../core/services/source.service';
import { MyGame, MyGameStatus } from '../../core/models/my-game.model';
import { Platform } from '../../core/models/platform.model';
import { Source } from '../../core/models/source.model';
import { MyGameFormComponent } from '../my-games/my-game-form/my-game-form.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastNotificationComponent } from '../../shared/components/toast-notification/toast-notification.component';
import { MY_GAME_STATUS_OPTIONS } from '../../core/models/my-game.model';

@Component({
  selector: 'app-my-games',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableListComponent,
    MyGameFormComponent,
    ToastNotificationComponent
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  private readonly confirmService = inject(ConfirmService);
  private readonly myGameService = inject(MyGameService);
  private readonly platformService = inject(PlatformService);
  private readonly sourceService = inject(SourceService);

  // Status que queremos mostrar: WISHLIST
  private readonly ALLOWED_STATUSES: MyGameStatus[] = [
    'WISHLIST'
  ];

  // Configuração da tabela
  readonly columns: TableColumn[] = [
    {
      key: 'game',
      header: 'Jogo',
      type: 'text',
      transform: (myGame) => myGame.game?.title || 'N/A'
    },
    {
      key: 'platform',
      header: 'Plataforma',
      type: 'text',
      transform: (myGame) => myGame.platform?.name || 'N/A'
    },
    {
      key: 'source',
      header: 'Loja/Origem',
      type: 'text',
      transform: (myGame) => myGame.source?.name || 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      type: 'text',
      transform: (myGame) => {
        const statusOption = MY_GAME_STATUS_OPTIONS.find(opt => opt.value === myGame.status);
        return statusOption?.label || myGame.status;
      }
    }
  ];

  readonly actions: TableAction[] = [
    { icon: '✏️', label: 'Editar', callback: (item) => this.editMyGame(item) },
    { icon: '🗑️', label: 'Excluir', callback: (item) => this.deleteMyGame(item) }
  ];

  // Estado usando signals
  myGamesData = signal<MyGame[]>([]);
  platforms = signal<Platform[]>([]);
  sources = signal<Source[]>([]);
  
  searchTitle = signal<string>('');
  selectedPlatformId = signal<number>(0);
  selectedSourceId = signal<number>(0);
  
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);
  showForm = signal<boolean>(false);
  editingMyGame = signal<MyGame | null>(null);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Computed signals
  isFilterActive = computed(() => 
    this.searchTitle().trim().length > 0 || 
    this.selectedPlatformId() > 0 || 
    this.selectedSourceId() > 0
  );

  activeFiltersText = computed(() => {
    const filters: string[] = [];
    
    if (this.searchTitle().trim()) {
      filters.push(`Título: "${this.searchTitle()}"`);
    }
    
    if (this.selectedPlatformId() > 0) {
      const platform = this.platforms().find(p => p.id === this.selectedPlatformId());
      if (platform) {
        filters.push(`Plataforma: ${platform.name}`);
      }
    }
    
    if (this.selectedSourceId() > 0) {
      const source = this.sources().find(s => s.id === this.selectedSourceId());
      if (source) {
        filters.push(`Loja: ${source.name}`);
      }
    }
    
    return filters.join(' | ');
  });

  ngOnInit(): void {
    this.loadPlatforms();
    this.loadSources();
    this.loadMyGames();
  }

  loadPlatforms(): void {
    this.platformService.getPlatforms(0, 100).subscribe({
      next: (response) => {
        this.platforms.set(response.content);
      },
      error: (error) => {
        console.error('Erro ao carregar plataformas:', error);
      }
    });
  }

  loadSources(): void {
    this.sourceService.getSources(0, 100).subscribe({
      next: (response) => {
        this.sources.set(response.content);
      },
      error: (error) => {
        console.error('Erro ao carregar lojas:', error);
      }
    });
  }

  loadMyGames(): void {
    this.isLoading.set(true);
    const titleValue = this.searchTitle().trim() || undefined;
    const platformValue = this.selectedPlatformId() > 0 ? this.selectedPlatformId() : undefined;
    const sourceValue = this.selectedSourceId() > 0 ? this.selectedSourceId() : undefined;

    this.myGameService.getMyGames(
      this.currentPage(), 
      this.pageSize(), 
      titleValue,
      platformValue,
      sourceValue,
      this.ALLOWED_STATUSES
    ).subscribe({
      next: (response) => {
        this.myGamesData.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.currentPage.set(response.number);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar meus jogos:', error);
        this.isLoading.set(false);
        this.showToastMessage('Erro ao carregar meus jogos', 'error');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadMyGames();
  }

  clearFilters(): void {
    this.searchTitle.set('');
    this.selectedPlatformId.set(0);
    this.selectedSourceId.set(0);
    this.currentPage.set(0);
    this.loadMyGames();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadMyGames();
  }

  openCreateForm(): void {
    this.editingMyGame.set(null);
    this.showForm.set(true);
  }

  editMyGame(myGame: MyGame): void {
    this.editingMyGame.set({ ...myGame });
    this.showForm.set(true);
  }

  deleteMyGame(myGame: MyGame): void {
    const gameTitle = myGame.game?.title || 'este jogo';
    this.confirmService.confirm(
      'Confirmar Exclusão',
      `Deseja realmente remover "${gameTitle}" da sua coleção?`
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.myGameService.deleteMyGame(myGame.id!).subscribe({
          next: () => {
            this.showToastMessage('Jogo removido da coleção com sucesso!', 'success');
            this.loadMyGames();
          },
          error: (error) => {
            console.error('Erro ao remover jogo:', error);
            this.showToastMessage('Erro ao remover jogo da coleção', 'error');
          }
        });
      }
    });
  }

  onFormSubmit(myGame: MyGame): void {
    const isEditing = !!this.editingMyGame()?.id;

    if (isEditing) {
      this.myGameService.changeStatus(myGame.id!, myGame.status).subscribe({
        next: () => {
          this.showToastMessage('Status atualizado com sucesso!', 'success');
          this.closeForm();
          this.loadMyGames();
        },
        error: (error) => {
          console.error('Erro ao atualizar jogo:', error);
          this.handleApiError(error);
        }
      });
    } else {
      this.myGameService.createMyGame(myGame).subscribe({
        next: () => {
          this.showToastMessage('Jogo adicionado à coleção com sucesso!', 'success');
          this.closeForm();
          this.loadMyGames();
        },
        error: (error) => {
          console.error('Erro ao adicionar jogo:', error);
          this.handleApiError(error);
        }
      });
    }
  }

  private handleApiError(error: any): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = 'Este jogo já existe na sua coleção com esta plataforma e loja';
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
    this.editingMyGame.set(null);
  }

  handleAction(event: { action: TableAction, item: any }): void {
    event.action.callback(event.item);
  }

  updateSearchTitle(value: string): void {
    this.searchTitle.set(value);
  }

  updatePlatformFilter(value: number): void {
    this.selectedPlatformId.set(value);
  }

  updateSourceFilter(value: number): void {
    this.selectedSourceId.set(value);
  }
}