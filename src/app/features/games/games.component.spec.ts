import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GamesComponent } from './games.component';
import { GameService } from '../../core/services/game.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError, delay } from 'rxjs';
import { Game } from '../../core/models/game.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('GamesComponent', () => {
  let component: GamesComponent;
  let fixture: ComponentFixture<GamesComponent>;
  let gameService: jasmine.SpyObj<GameService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;
  let compiled: HTMLElement;

  // Mock data
  const mockGames: Game[] = [
    {
      id: 1,
      title: 'The Legend of Zelda',
      description: 'Adventure game',
      released_at: '2017-03-03',
      company_id: 1,
      genre_ids: [1, 2],
      theme_ids: [1],
      company: { id: 1, name: 'Nintendo' }
    },
    {
      id: 2,
      title: 'Super Mario Odyssey',
      description: 'Platform game',
      released_at: '2017-10-27',
      company_id: 1,
      genre_ids: [3],
      theme_ids: [2],
      company: { id: 1, name: 'Nintendo' }
    }
  ];

  const mockPaginatedResponse: PaginatedResponse<Game> = {
    content: mockGames,
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true
  };

  const mockMultiPageResponse: PaginatedResponse<Game> = {
    content: mockGames,
    totalElements: 25,
    totalPages: 3,
    size: 10,
    number: 0,
    first: true,
    last: false
  };

  beforeEach(async () => {
    const gameServiceSpy = jasmine.createSpyObj('GameService', [
      'getGames',
      'createGame',
      'updateGame',
      'deleteGame'
    ]);
    const confirmServiceSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [GamesComponent, HttpClientTestingModule],
      providers: [
        { provide: GameService, useValue: gameServiceSpy },
        { provide: ConfirmService, useValue: confirmServiceSpy }
      ]
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;

    gameService.getGames.and.returnValue(of(mockPaginatedResponse));

    fixture = TestBed.createComponent(GamesComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load games on init', () => {
      fixture.detectChanges();

      expect(gameService.getGames).toHaveBeenCalledWith(0, 10, undefined);
      expect(component.gamesData()).toEqual(mockGames);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
      expect(component.isLoading()).toBeFalse();
    });

    it('should handle loading error', () => {
      gameService.getGames.and.returnValue(throwError(() => new Error('Network error')));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar jogos:', jasmine.any(Error));
      expect(component.isLoading()).toBeFalse();
      expect(component.showToast()).toBeTrue();
      expect(component.toastMessage()).toBe('Erro ao carregar jogos');
      expect(component.toastType()).toBe('error');
    });

    it('should set loading state while fetching', fakeAsync(() => {
      // Criar um observable com delay para simular requisição HTTP assíncrona
      const delayedResponse = of(mockPaginatedResponse).pipe(delay(100));
      gameService.getGames.and.returnValue(delayedResponse);
      
      // Criar um novo componente sem ter chamado ngOnInit ainda
      const testFixture = TestBed.createComponent(GamesComponent);
      const testComponent = testFixture.componentInstance;
      
      // Estado inicial deve ser false
      expect(testComponent.isLoading()).toBeFalse();

      // Chamar loadGames manualmente
      testComponent.loadGames();
      
      // Deve estar true imediatamente após chamar loadGames
      expect(testComponent.isLoading()).toBeTrue();

      tick(100); // Processar observable com delay
      
      // Deve voltar para false após o observable completar
      expect(testComponent.isLoading()).toBeFalse();
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update search term', () => {
      component.updateSearchTerm('Zelda');

      expect(component.searchTerm()).toBe('Zelda');
    });

    it('should trigger search when onSearch is called', () => {
      component.searchTerm.set('Mario');
      gameService.getGames.calls.reset();

      component.onSearch();

      expect(gameService.getGames).toHaveBeenCalledWith(0, 10, 'Mario');
      expect(component.currentPage()).toBe(0);
    });

    it('should reset page to 0 when searching', () => {
      component.currentPage.set(2);
      component.searchTerm.set('Zelda');

      component.onSearch();

      expect(component.currentPage()).toBe(0);
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('Mario');
      component.currentPage.set(2);
      gameService.getGames.calls.reset();

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(gameService.getGames).toHaveBeenCalledWith(0, 10, undefined);
    });

    it('should compute isFilterActive correctly', () => {
      expect(component.isFilterActive()).toBeFalse();

      component.searchTerm.set('Zelda');
      expect(component.isFilterActive()).toBeTrue();

      component.searchTerm.set('   ');
      expect(component.isFilterActive()).toBeFalse();
    });

    it('should not pass empty search term to service', () => {
      component.searchTerm.set('   ');
      gameService.getGames.calls.reset();

      component.loadGames();

      expect(gameService.getGames).toHaveBeenCalledWith(0, 10, undefined);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      gameService.getGames.and.returnValue(of(mockMultiPageResponse));
      fixture.detectChanges();
    });

    it('should change page', fakeAsync(() => {
      gameService.getGames.calls.reset();
      
      // Mock response para a página 1
      const page1Response: PaginatedResponse<Game> = {
        ...mockMultiPageResponse,
        number: 1
      };
      gameService.getGames.and.returnValue(of(page1Response));

      component.onPageChange(1);
      tick(); // Processar observable
      fixture.detectChanges();

      expect(gameService.getGames).toHaveBeenCalledWith(1, 10, undefined);
      expect(component.currentPage()).toBe(1);
    }));

    it('should display correct pagination info', () => {
      expect(component.totalPages()).toBe(3);
      expect(component.totalElements()).toBe(25);
      expect(component.currentPage()).toBe(0);
    });

    it('should handle last page correctly', () => {
      const lastPageResponse: PaginatedResponse<Game> = {
        ...mockMultiPageResponse,
        number: 2,
        first: false,
        last: true
      };
      gameService.getGames.and.returnValue(of(lastPageResponse));

      component.onPageChange(2);
      fixture.detectChanges();

      expect(component.currentPage()).toBe(2);
    });
  });

  describe('Form Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBeTrue();
      expect(component.editingGame()).toBeNull();
    });

    it('should close form', () => {
      component.showForm.set(true);
      component.editingGame.set(mockGames[0]);

      component.closeForm();

      expect(component.showForm()).toBeFalse();
      expect(component.editingGame()).toBeNull();
    });

    it('should open edit form with game data', () => {
      const gameToEdit = mockGames[0];

      component.editGame(gameToEdit);

      expect(component.showForm()).toBeTrue();
      expect(component.editingGame()).toEqual(gameToEdit);
      expect(component.editingGame()).not.toBe(gameToEdit); // Should be a copy
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Create Game', () => {
      it('should create game successfully', () => {
        const newGame: Game = {
          title: 'New Game',
          description: 'Description',
          released_at: '2024-01-01',
          company_id: 1,
          genre_ids: [1],
          theme_ids: [1]
        };
        const createdGame: Game = { ...newGame, id: 3 };

        gameService.createGame.and.returnValue(of(createdGame));
        gameService.getGames.calls.reset();

        component.onFormSubmit(newGame);

        expect(gameService.createGame).toHaveBeenCalledWith(newGame);
        expect(component.showToast()).toBeTrue();
        expect(component.toastMessage()).toBe('Jogo criado com sucesso!');
        expect(component.toastType()).toBe('success');
        expect(component.showForm()).toBeFalse();
        expect(gameService.getGames).toHaveBeenCalled();
      });

      it('should handle create error with conflict', () => {
        const newGame: Game = {
          title: 'Duplicate Game',
          description: 'Description',
          released_at: '2024-01-01',
          company_id: 1,
          genre_ids: [1],
          theme_ids: [1]
        };

        gameService.createGame.and.returnValue(
          throwError(() => ({ status: 409, error: { message: 'Conflict' } }))
        );
        spyOn(console, 'error');

        component.onFormSubmit(newGame);

        expect(console.error).toHaveBeenCalled();
        expect(component.showToast()).toBeTrue();
        expect(component.toastMessage()).toBe('Já existe um jogo com este título');
        expect(component.toastType()).toBe('error');
      });

      it('should handle create error with validation', () => {
        const invalidGame: Game = {
          title: '',
          description: '',
          released_at: '',
          company_id: 0,
          genre_ids: [],
          theme_ids: []
        };

        gameService.createGame.and.returnValue(
          throwError(() => ({ status: 400, error: { message: 'Validation error' } }))
        );

        component.onFormSubmit(invalidGame);

        expect(component.toastMessage()).toBe('Validation error');
        expect(component.toastType()).toBe('error');
      });
    });

    describe('Update Game', () => {
      it('should update game successfully', () => {
        const updatedGame: Game = {
          ...mockGames[0],
          title: 'Updated Title'
        };

        component.editingGame.set(mockGames[0]);
        gameService.updateGame.and.returnValue(of(updatedGame));
        gameService.getGames.calls.reset();

        component.onFormSubmit(updatedGame);

        expect(gameService.updateGame).toHaveBeenCalledWith(updatedGame);
        expect(component.showToast()).toBeTrue();
        expect(component.toastMessage()).toBe('Jogo atualizado com sucesso!');
        expect(component.toastType()).toBe('success');
        expect(component.showForm()).toBeFalse();
        expect(gameService.getGames).toHaveBeenCalled();
      });

      it('should handle update error', () => {
        const gameToUpdate = mockGames[0];

        component.editingGame.set(gameToUpdate);
        gameService.updateGame.and.returnValue(
          throwError(() => ({ status: 500, error: { message: 'Server error' } }))
        );
        spyOn(console, 'error');

        component.onFormSubmit(gameToUpdate);

        expect(console.error).toHaveBeenCalled();
        expect(component.toastMessage()).toBe('Erro ao processar solicitação');
        expect(component.toastType()).toBe('error');
      });
    });

    describe('Delete Game', () => {
      it('should delete game when confirmed', () => {
        const gameToDelete = mockGames[0];

        confirmService.confirm.and.returnValue(of(true));
        gameService.deleteGame.and.returnValue(of(void 0));
        gameService.getGames.calls.reset();

        component.deleteGame(gameToDelete);

        expect(confirmService.confirm).toHaveBeenCalledWith(
          'Confirmar Exclusão',
          `Deseja realmente excluir o jogo "${gameToDelete.title}"?`
        );
        expect(gameService.deleteGame).toHaveBeenCalledWith(gameToDelete.id!);
        expect(component.showToast()).toBeTrue();
        expect(component.toastMessage()).toBe('Jogo excluído com sucesso!');
        expect(component.toastType()).toBe('success');
        expect(gameService.getGames).toHaveBeenCalled();
      });

      it('should not delete game when not confirmed', () => {
        const gameToDelete = mockGames[0];

        confirmService.confirm.and.returnValue(of(false));

        component.deleteGame(gameToDelete);

        expect(confirmService.confirm).toHaveBeenCalled();
        expect(gameService.deleteGame).not.toHaveBeenCalled();
      });

      it('should handle delete error', () => {
        const gameToDelete = mockGames[0];

        confirmService.confirm.and.returnValue(of(true));
        gameService.deleteGame.and.returnValue(throwError(() => new Error('Delete failed')));
        spyOn(console, 'error');

        component.deleteGame(gameToDelete);

        expect(console.error).toHaveBeenCalledWith('Erro ao excluir jogo:', jasmine.any(Error));
        expect(component.showToast()).toBeTrue();
        expect(component.toastMessage()).toBe('Erro ao excluir jogo');
        expect(component.toastType()).toBe('error');
      });
    });
  });

  describe('Table Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle action click', () => {
      const action = component.actions[0]; // Edit action
      const game = mockGames[0];
      spyOn(component, 'editGame');

      component.handleAction({ action, item: game });

      expect(component.editGame).toHaveBeenCalledWith(game);
    });

    it('should have correct action configuration', () => {
      expect(component.actions.length).toBe(2);
      expect(component.actions[0].label).toBe('Editar');
      expect(component.actions[1].label).toBe('Excluir');
    });
  });

  describe('Table Column Configuration', () => {
    it('should have correct columns', () => {
      expect(component.columns.length).toBe(3);
      expect(component.columns[0].key).toBe('title');
      expect(component.columns[1].key).toBe('company');
      expect(component.columns[2].key).toBe('released_at');
    });

    it('should transform company column correctly', () => {
      const transform = component.columns[1].transform;
      expect(transform).toBeDefined();

      const gameWithCompany = mockGames[0];
      const gameWithoutCompany = { ...mockGames[0], company: undefined };

      expect(transform!(gameWithCompany)).toBe('Nintendo');
      expect(transform!(gameWithoutCompany)).toBe('N/A');
    });

    it('should transform date column correctly', () => {
      const transform = component.columns[2].transform;
      expect(transform).toBeDefined();

      const gameWithDate = mockGames[0];
      const result = transform!(gameWithDate);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/); // Brazilian date format

      const gameWithoutDate = { ...mockGames[0], released_at: '' };
      expect(transform!(gameWithoutDate)).toBe('---');

      const gameWithInvalidDate = { ...mockGames[0], released_at: 'invalid-date' };
      expect(transform!(gameWithInvalidDate)).toBe('Data inválida');
    });
  });

  describe('DOM Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render page header with title and button', () => {
      const header = compiled.querySelector('.page-header');
      expect(header).toBeTruthy();
      expect(header?.querySelector('h2')?.textContent).toBe('Jogos');
      expect(header?.querySelector('.btn-primary')?.textContent).toContain('Novo Jogo');
    });

    it('should render search bar', () => {
      const searchBar = compiled.querySelector('.search-bar');
      expect(searchBar).toBeTruthy();
      
      const searchInput = searchBar?.querySelector('.search-input') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toContain('Buscar jogo');
    });

    it('should show clear button when filter is active', () => {
      component.searchTerm.set('Test');
      fixture.detectChanges();

      const clearButton = compiled.querySelector('.btn-clear');
      expect(clearButton).toBeTruthy();
    });

    it('should hide clear button when filter is not active', () => {
      component.searchTerm.set('');
      fixture.detectChanges();

      const clearButton = compiled.querySelector('.btn-clear');
      expect(clearButton).toBeFalsy();
    });

    it('should show filter indicator badge when filter is active', () => {
      component.searchTerm.set('Zelda');
      fixture.detectChanges();

      const filterBadge = compiled.querySelector('.filter-badge');
      expect(filterBadge).toBeTruthy();
      expect(filterBadge?.textContent).toContain('Zelda');
    });

    it('should show loading message when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loading = compiled.querySelector('.loading');
      expect(loading).toBeTruthy();
      expect(loading?.textContent).toBe('Carregando...');
    });

    it('should show pagination when multiple pages exist', () => {
      gameService.getGames.and.returnValue(of(mockMultiPageResponse));
      component.loadGames();
      fixture.detectChanges();

      const pagination = compiled.querySelector('.pagination');
      expect(pagination).toBeTruthy();
    });

    it('should hide pagination when only one page exists', () => {
      const pagination = compiled.querySelector('.pagination');
      expect(pagination).toBeFalsy();
    });

    it('should show modal when form is open', () => {
      component.showForm.set(true);
      fixture.detectChanges();

      const modal = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should hide modal when form is closed', () => {
      component.showForm.set(false);
      fixture.detectChanges();

      const modal = compiled.querySelector('.modal-overlay');
      expect(modal).toBeFalsy();
    });

    it('should trigger search on enter key', () => {
      spyOn(component, 'onSearch');
      
      const searchInput = compiled.querySelector('.search-input') as HTMLInputElement;
      const event = new KeyboardEvent('keyup', { key: 'Enter' });
      searchInput.dispatchEvent(event);

      fixture.detectChanges();
      expect(component.onSearch).toHaveBeenCalled();
    });

    it('should call openCreateForm when new game button is clicked', () => {
      spyOn(component, 'openCreateForm');

      const button = compiled.querySelector('.btn-primary') as HTMLButtonElement;
      button.click();

      expect(component.openCreateForm).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle different API error types', () => {
      const testCases = [
        { status: 409, expectedMessage: 'Já existe um jogo com este título' },
        { status: 400, expectedMessage: 'Custom error', error: { message: 'Custom error' } },
        { status: 500, expectedMessage: 'Erro ao processar solicitação' }
      ];

      testCases.forEach(testCase => {
        const error = { status: testCase.status, error: testCase.error };
        component['handleApiError'](error);

        expect(component.toastMessage()).toBe(testCase.expectedMessage);
        expect(component.toastType()).toBe('error');
      });
    });

    it('should use default message for validation errors without specific message', () => {
      const error = { status: 400, error: {} };
      component['handleApiError'](error);

      expect(component.toastMessage()).toBe('Dados inválidos');
    });
  });

  describe('Toast Notifications', () => {
    it('should show toast with correct message and type', () => {
      component['showToastMessage']('Test message', 'success');

      expect(component.showToast()).toBeTrue();
      expect(component.toastMessage()).toBe('Test message');
      expect(component.toastType()).toBe('success');
    });

    it('should handle different toast types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];

      types.forEach(type => {
        component['showToastMessage'](`${type} message`, type);
        expect(component.toastType()).toBe(type);
      });
    });
  });
});