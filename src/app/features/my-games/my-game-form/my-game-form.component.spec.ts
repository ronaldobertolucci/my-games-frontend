import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MyGamesComponent } from '../my-games.component';
import { MyGameService } from '../../../core/services/my-game.service';
import { PlatformService } from '../../../core/services/platform.service';
import { SourceService } from '../../../core/services/source.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MyGame } from '../../../core/models/my-game.model';
import { Platform } from '../../../core/models/platform.model';
import { Source } from '../../../core/models/source.model';
import { PaginatedResponse } from '../../../core/models/paginated-response.model';

describe('MyGamesComponent', () => {
  let component: MyGamesComponent;
  let fixture: ComponentFixture<MyGamesComponent>;
  let myGameService: jasmine.SpyObj<MyGameService>;
  let platformService: jasmine.SpyObj<PlatformService>;
  let sourceService: jasmine.SpyObj<SourceService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  const mockPlatforms: Platform[] = [
    { id: 1, name: 'PC' },
    { id: 2, name: 'PS5' }
  ];

  const mockSources: Source[] = [
    { id: 1, name: 'Steam' },
    { id: 2, name: 'Epic Games' }
  ];

  const mockMyGames: MyGame[] = [
    {
      id: 1,
      user_id: 1,
      game_id: 1,
      platform_id: 1,
      source_id: 1,
      status: 'PLAYING',
      game: { id: 1, title: 'The Witcher 3', description: '', released_at: '2015-05-19', company_id: 1, genre_ids: [], theme_ids: [] },
      platform: { id: 1, name: 'PC' },
      source: { id: 1, name: 'Steam' }
    }
  ];

  const mockPaginatedResponse: PaginatedResponse<MyGame> = {
    content: mockMyGames,
    totalPages: 1,
    totalElements: 1,
    number: 0,
    size: 10,
    first: true,
    last: true
  };

  const mockPlatformResponse: PaginatedResponse<Platform> = {
    content: mockPlatforms,
    totalPages: 1,
    totalElements: 2,
    number: 0,
    size: 100,
    first: true,
    last: true
  };

  const mockSourceResponse: PaginatedResponse<Source> = {
    content: mockSources,
    totalPages: 1,
    totalElements: 2,
    number: 0,
    size: 100,
    first: true,
    last: true
  };

  beforeEach(async () => {
    const myGameServiceSpy = jasmine.createSpyObj('MyGameService', [
      'getMyGames',
      'createMyGame',
      'changeStatus',
      'deleteMyGame'
    ]);
    const platformServiceSpy = jasmine.createSpyObj('PlatformService', ['getPlatforms']);
    const sourceServiceSpy = jasmine.createSpyObj('SourceService', ['getSources']);
    const confirmServiceSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [MyGamesComponent],
      providers: [
        { provide: MyGameService, useValue: myGameServiceSpy },
        { provide: PlatformService, useValue: platformServiceSpy },
        { provide: SourceService, useValue: sourceServiceSpy },
        { provide: ConfirmService, useValue: confirmServiceSpy }
      ]
    }).compileComponents();

    myGameService = TestBed.inject(MyGameService) as jasmine.SpyObj<MyGameService>;
    platformService = TestBed.inject(PlatformService) as jasmine.SpyObj<PlatformService>;
    sourceService = TestBed.inject(SourceService) as jasmine.SpyObj<SourceService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;

    myGameService.getMyGames.and.returnValue(of(mockPaginatedResponse));
    platformService.getPlatforms.and.returnValue(of(mockPlatformResponse));
    sourceService.getSources.and.returnValue(of(mockSourceResponse));

    fixture = TestBed.createComponent(MyGamesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load platforms, sources and my games on init', () => {
      fixture.detectChanges();

      expect(platformService.getPlatforms).toHaveBeenCalledWith(0, 100);
      expect(sourceService.getSources).toHaveBeenCalledWith(0, 100);
      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, undefined, undefined, undefined);
      expect(component.platforms()).toEqual(mockPlatforms);
      expect(component.sources()).toEqual(mockSources);
      expect(component.myGamesData()).toEqual(mockMyGames);
    });

    it('should handle error when loading platforms', () => {
      platformService.getPlatforms.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar plataformas:', jasmine.any(Error));
    });

    it('should handle error when loading sources', () => {
      sourceService.getSources.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar lojas:', jasmine.any(Error));
    });
  });

  describe('loadMyGames', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load my games without filters', () => {
      component.loadMyGames();

      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, undefined, undefined, undefined);
      expect(component.myGamesData()).toEqual(mockMyGames);
      expect(component.isLoading()).toBe(false);
    });

    it('should load my games with title filter', () => {
      component.searchTitle.set('witcher');
      component.loadMyGames();

      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, 'witcher', undefined, undefined);
    });

    it('should load my games with platform filter', () => {
      component.selectedPlatformId.set(1);
      component.loadMyGames();

      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, undefined, 1, undefined);
    });

    it('should load my games with source filter', () => {
      component.selectedSourceId.set(2);
      component.loadMyGames();

      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, undefined, undefined, 2);
    });

    it('should load my games with all filters', () => {
      component.searchTitle.set('zelda');
      component.selectedPlatformId.set(2);
      component.selectedSourceId.set(1);
      component.loadMyGames();

      expect(myGameService.getMyGames).toHaveBeenCalledWith(0, 10, 'zelda', 2, 1);
    });

    it('should set loading state correctly', () => {
      expect(component.isLoading()).toBe(false);

      component.loadMyGames();

      expect(component.isLoading()).toBe(false); // já completou pelo mock
    });

    it('should handle error when loading my games', () => {
      myGameService.getMyGames.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      component.loadMyGames();

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar meus jogos:', jasmine.any(Error));
      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Erro ao carregar meus jogos');
      expect(component.toastType()).toBe('error');
    });
  });

  describe('onSearch', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset page to 0 and reload games', () => {
      component.currentPage.set(5);
      component.onSearch();

      expect(component.currentPage()).toBe(0);
      expect(myGameService.getMyGames).toHaveBeenCalled();
    });
  });

  describe('clearFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all filters and reload', () => {
      component.searchTitle.set('test');
      component.selectedPlatformId.set(1);
      component.selectedSourceId.set(2);
      component.currentPage.set(3);

      component.clearFilters();

      expect(component.searchTitle()).toBe('');
      expect(component.selectedPlatformId()).toBe(0);
      expect(component.selectedSourceId()).toBe(0);
      expect(component.currentPage()).toBe(0);
      expect(myGameService.getMyGames).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should change page and reload games', () => {
      const page2Response: PaginatedResponse<MyGame> = {
        content: mockMyGames,
        totalPages: 5,
        totalElements: 50,
        number: 2,
        size: 10,
        first: true,
        last: true
      };

      myGameService.getMyGames.and.returnValue(of(page2Response));

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(myGameService.getMyGames).toHaveBeenCalled();
    });
  });

  describe('openCreateForm', () => {
    it('should open form in create mode', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingMyGame()).toBeNull();
    });
  });

  describe('editMyGame', () => {
    it('should open form in edit mode with my game data', () => {
      const myGame = mockMyGames[0];
      component.editMyGame(myGame);

      expect(component.showForm()).toBe(true);
      expect(component.editingMyGame()).toEqual(myGame);
    });
  });

  describe('deleteMyGame', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delete my game after confirmation', () => {
      confirmService.confirm.and.returnValue(of(true));
      myGameService.deleteMyGame.and.returnValue(of(void 0));

      const myGame = mockMyGames[0];
      component.deleteMyGame(myGame);

      expect(confirmService.confirm).toHaveBeenCalledWith(
        'Confirmar Exclusão',
        'Deseja realmente remover "The Witcher 3" da sua coleção?'
      );
      expect(myGameService.deleteMyGame).toHaveBeenCalledWith(1);
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Jogo removido da coleção com sucesso!');
      expect(component.toastType()).toBe('success');
    });

    it('should not delete my game if not confirmed', () => {
      confirmService.confirm.and.returnValue(of(false));

      const myGame = mockMyGames[0];
      component.deleteMyGame(myGame);

      expect(myGameService.deleteMyGame).not.toHaveBeenCalled();
    });

    it('should handle error when deleting my game', () => {
      confirmService.confirm.and.returnValue(of(true));
      myGameService.deleteMyGame.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      const myGame = mockMyGames[0];
      component.deleteMyGame(myGame);

      expect(console.error).toHaveBeenCalledWith('Erro ao remover jogo:', jasmine.any(Error));
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Erro ao remover jogo da coleção');
      expect(component.toastType()).toBe('error');
    });

    it('should use fallback text when game has no title', () => {
      confirmService.confirm.and.returnValue(of(true));
      myGameService.deleteMyGame.and.returnValue(of(void 0));

      const myGameWithoutTitle: MyGame = {
        id: 2,
        user_id: 1,
        game_id: 2,
        platform_id: 1,
        source_id: 1,
        status: 'PLAYING'
      };

      component.deleteMyGame(myGameWithoutTitle);

      expect(confirmService.confirm).toHaveBeenCalledWith(
        'Confirmar Exclusão',
        'Deseja realmente remover "este jogo" da sua coleção?'
      );
    });
  });

  describe('onFormSubmit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create new my game when not editing', () => {
      const newMyGame: MyGame = {
        game_id: 2,
        platform_id: 1,
        source_id: 1,
        status: 'WISHLIST'
      };

      myGameService.createMyGame.and.returnValue(of({ ...newMyGame, id: 10, user_id: 1 }));
      component.editingMyGame.set(null);

      component.onFormSubmit(newMyGame);

      expect(myGameService.createMyGame).toHaveBeenCalledWith(newMyGame);
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Jogo adicionado à coleção com sucesso!');
      expect(component.showForm()).toBe(false);
    });

    it('should update status when editing', () => {
      const existingMyGame: MyGame = {
        id: 7,
        user_id: 1,
        game_id: 6,
        platform_id: 21,
        source_id: 1,
        status: 'COMPLETED'
      };

      myGameService.changeStatus.and.returnValue(of(existingMyGame));
      component.editingMyGame.set({ ...existingMyGame, status: 'PLAYING' });

      component.onFormSubmit(existingMyGame);

      expect(myGameService.changeStatus).toHaveBeenCalledWith(7, 'COMPLETED');
      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Status atualizado com sucesso!');
      expect(component.showForm()).toBe(false);
    });

    it('should handle 409 error when creating duplicate', () => {
      const newMyGame: MyGame = {
        game_id: 1,
        platform_id: 1,
        source_id: 1,
        status: 'PLAYING'
      };

      myGameService.createMyGame.and.returnValue(throwError(() => ({ status: 409 })));
      spyOn(console, 'error');
      component.editingMyGame.set(null);

      component.onFormSubmit(newMyGame);

      expect(component.showToast()).toBe(true);
      expect(component.toastMessage()).toBe('Este jogo já existe na sua coleção com esta plataforma e loja');
      expect(component.toastType()).toBe('error');
    });

    it('should handle 400 error with custom message', () => {
      const newMyGame: MyGame = {
        game_id: 1,
        platform_id: 1,
        source_id: 1,
        status: 'PLAYING'
      };

      myGameService.createMyGame.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Campo inválido' } }))
      );
      spyOn(console, 'error');
      component.editingMyGame.set(null);

      component.onFormSubmit(newMyGame);

      expect(component.toastMessage()).toBe('Campo inválido');
    });

    it('should handle generic error', () => {
      const newMyGame: MyGame = {
        game_id: 1,
        platform_id: 1,
        source_id: 1,
        status: 'PLAYING'
      };

      myGameService.createMyGame.and.returnValue(throwError(() => ({ status: 500 })));
      spyOn(console, 'error');
      component.editingMyGame.set(null);

      component.onFormSubmit(newMyGame);

      expect(component.toastMessage()).toBe('Erro ao processar solicitação');
    });
  });

  describe('closeForm', () => {
    it('should close form and clear editing state', () => {
      component.showForm.set(true);
      component.editingMyGame.set(mockMyGames[0]);

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingMyGame()).toBeNull();
    });
  });

  describe('computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('isFilterActive should return true when title filter is set', () => {
      component.searchTitle.set('test');
      expect(component.isFilterActive()).toBe(true);
    });

    it('isFilterActive should return true when platform filter is set', () => {
      component.selectedPlatformId.set(1);
      expect(component.isFilterActive()).toBe(true);
    });

    it('isFilterActive should return true when source filter is set', () => {
      component.selectedSourceId.set(1);
      expect(component.isFilterActive()).toBe(true);
    });

    it('isFilterActive should return false when no filters are set', () => {
      component.searchTitle.set('');
      component.selectedPlatformId.set(0);
      component.selectedSourceId.set(0);
      expect(component.isFilterActive()).toBe(false);
    });

    it('activeFiltersText should build correct filter text', () => {
      component.searchTitle.set('witcher');
      component.selectedPlatformId.set(1);
      component.selectedSourceId.set(1);

      const expected = 'Título: "witcher" | Plataforma: PC | Loja: Steam';
      expect(component.activeFiltersText()).toBe(expected);
    });

    it('activeFiltersText should handle partial filters', () => {
      component.searchTitle.set('');
      component.selectedPlatformId.set(1);
      component.selectedSourceId.set(0);

      expect(component.activeFiltersText()).toBe('Plataforma: PC');
    });
  });

  describe('update methods', () => {
    it('updateSearchTitle should update searchTitle signal', () => {
      component.updateSearchTitle('new search');
      expect(component.searchTitle()).toBe('new search');
    });

    it('updatePlatformFilter should update selectedPlatformId signal', () => {
      component.updatePlatformFilter(5);
      expect(component.selectedPlatformId()).toBe(5);
    });

    it('updateSourceFilter should update selectedSourceId signal', () => {
      component.updateSourceFilter(3);
      expect(component.selectedSourceId()).toBe(3);
    });
  });

  describe('handleAction', () => {
    it('should call action callback with item', () => {
      const mockAction = { icon: '✏️', label: 'Editar', callback: jasmine.createSpy('callback') };
      const mockItem = mockMyGames[0];

      component.handleAction({ action: mockAction, item: mockItem });

      expect(mockAction.callback).toHaveBeenCalledWith(mockItem);
    });
  });
});