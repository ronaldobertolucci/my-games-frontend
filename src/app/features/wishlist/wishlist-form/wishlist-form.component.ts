import { Component, input, output, OnInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MyGame, MY_GAME_STATUS_OPTIONS, MyGameStatus } from '../../../core/models/my-game.model';
import { Game } from '../../../core/models/game.model';
import { Platform } from '../../../core/models/platform.model';
import { Source } from '../../../core/models/source.model';
import { GameService } from '../../../core/services/game.service';
import { PlatformService } from '../../../core/services/platform.service';
import { SourceService } from '../../../core/services/source.service';
import { GameFormComponent } from '../../games/game-form/game-form.component';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';

@Component({
  selector: 'app-wishlist-form',
  imports: [CommonModule, FormsModule, GameFormComponent, ToastNotificationComponent],
  templateUrl: './wishlist-form.component.html',
  styleUrl: './wishlist-form.component.css'
})
export class WishlistFormComponent {
  private readonly gameService = inject(GameService);
  private readonly platformService = inject(PlatformService);
  private readonly sourceService = inject(SourceService);

  // Inputs e Outputs
  myGame = input<MyGame | null>(null);
  save = output<MyGame>();
  cancel = output<void>();

  // Campos do formulário como signals individuais
  gameId = signal<number>(0);
  platformId = signal<number>(0);
  sourceId = signal<number>(0);
  status = signal<MyGameStatus>('WISHLIST');

  // Dados adicionais para edição
  id = signal<number | undefined>(undefined);
  userId = signal<number | undefined>(undefined);

  // Listas de dados
  games = signal<Game[]>([]);
  platforms = signal<Platform[]>([]);
  sources = signal<Source[]>([]);

  // Estados de loading e modais
  isLoadingGames = signal<boolean>(false);
  isLoadingPlatforms = signal<boolean>(false);
  isLoadingSources = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  errorMessage = signal<string>('');
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error' | 'warning' | 'info'>('success');
  showToast = signal<boolean>(false);

  // Modais de criação rápida
  showGameModal = signal<boolean>(false);
  showPlatformModal = signal<boolean>(false);
  showSourceModal = signal<boolean>(false);

  newPlatformName = signal<string>('');
  newSourceName = signal<string>('');

  ALLOWED_ON_INIT: { value: MyGameStatus; label: string }[] = [
    { value: 'WISHLIST', label: 'lista de desejos' }
  ];

  // Opções de status
  statusOptions = this.ALLOWED_ON_INIT;

  constructor() {
    effect(() => {
      const myGameValue = this.myGame();
      if (myGameValue) {
        // Extrai os IDs dos objetos aninhados ou usa os IDs diretos
        this.id.set(myGameValue.id);
        this.userId.set(myGameValue.user_id);
        this.gameId.set(myGameValue.game_id || myGameValue.game?.id || 0);
        this.platformId.set(myGameValue.platform_id || myGameValue.platform?.id || 0);
        this.sourceId.set(myGameValue.source_id || myGameValue.source?.id || 0);
        this.status.set(myGameValue.status || 'WISHLIST');
        this.isEditMode.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.loadGames();
    this.loadPlatforms();
    this.loadSources();
    this.statusOptions = this.myGame() ? MY_GAME_STATUS_OPTIONS : this.ALLOWED_ON_INIT;
  }

  // Carregamento de dados
  loadGames(): void {
    this.isLoadingGames.set(true);
    this.gameService.getGames(0, 1000).subscribe({
      next: (response) => {
        this.games.set(response.content);
        this.isLoadingGames.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar jogos:', error);
        this.isLoadingGames.set(false);
      }
    });
  }

  loadPlatforms(): void {
    this.isLoadingPlatforms.set(true);
    this.platformService.getPlatforms(0, 100).subscribe({
      next: (response) => {
        this.platforms.set(response.content);
        this.isLoadingPlatforms.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar plataformas:', error);
        this.isLoadingPlatforms.set(false);
      }
    });
  }

  loadSources(): void {
    this.isLoadingSources.set(true);
    this.sourceService.getSources(0, 100).subscribe({
      next: (response) => {
        this.sources.set(response.content);
        this.isLoadingSources.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar lojas:', error);
        this.isLoadingSources.set(false);
      }
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (this.gameId() === 0) {
      this.errorMessage.set('Por favor, selecione um jogo');
      return;
    }

    if (this.platformId() === 0) {
      this.errorMessage.set('Por favor, selecione uma plataforma');
      return;
    }

    if (this.sourceId() === 0) {
      this.errorMessage.set('Por favor, selecione uma loja/origem');
      return;
    }

    const myGameData: MyGame = {
      id: this.id(),
      user_id: this.userId(),
      game_id: this.gameId(),
      platform_id: this.platformId(),
      source_id: this.sourceId(),
      status: this.status()
    };

    this.save.emit(myGameData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Criação rápida de Game
  openGameModal(): void {
    this.showGameModal.set(true);
  }

  closeGameModal(): void {
    this.showGameModal.set(false);
  }

  onGameCreated(game: Game): void {
    this.gameService.createGame(game).subscribe({
      next: (created) => {
        this.games.update(list => [...list, created]);
        this.gameId.set(created.id!);
        this.closeGameModal();
        this.showToastMessage('Jogo cadastrado com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar jogo:', error);
        this.handleApiError(error, 'jogo');
      }
    });
  }

  // Criação rápida de Platform
  openPlatformModal(): void {
    this.newPlatformName.set('');
    this.showPlatformModal.set(true);
  }

  closePlatformModal(): void {
    this.showPlatformModal.set(false);
  }

  createPlatform(): void {
    const name = this.newPlatformName().trim();
    if (!name) {
      return;
    }

    this.platformService.createPlatform({ name }).subscribe({
      next: (created) => {
        this.platforms.update(list => [...list, created]);
        this.platformId.set(created.id!);
        this.closePlatformModal();
        this.showToastMessage('Plataforma cadastrada com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar plataforma:', error);
        this.handleApiError(error, 'plataforma');
      }
    });
  }

  // Criação rápida de Source
  openSourceModal(): void {
    this.newSourceName.set('');
    this.showSourceModal.set(true);
  }

  closeSourceModal(): void {
    this.showSourceModal.set(false);
  }

  createSource(): void {
    const name = this.newSourceName().trim();
    if (!name) {
      return;
    }

    this.sourceService.createSource({ name }).subscribe({
      next: (created) => {
        this.sources.update(list => [...list, created]);
        this.sourceId.set(created.id!);
        this.closeSourceModal();
        this.showToastMessage('Loja cadastrada com sucesso!', 'success');
      },
      error: (error) => {
        console.error('Erro ao criar loja:', error);
        this.handleApiError(error, 'loja');
      }
    });
  }

  private handleApiError(error: any, type: string): void {
    let errorMessage = '';

    if (error.status === 409) {
      errorMessage = `Já existe ${type} com este nome`;
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
}