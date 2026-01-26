import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { GenresComponent } from './genres.component';
import { GenreService } from '../../core/services/genre.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError } from 'rxjs';
import { Genre } from '../../core/models/genre.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('GenresComponent', () => {
  let component: GenresComponent;
  let fixture: ComponentFixture<GenresComponent>;
  let genreServiceMock: jasmine.SpyObj<GenreService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const mockPaginatedResponse: PaginatedResponse<Genre> = {
    content: [
      { id: 1, name: 'Adventure' },
      { id: 2, name: 'Shooter' }
    ],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true
  };

  beforeEach(async () => {
    spyOn(console, 'error');

    genreServiceMock = jasmine.createSpyObj('GenreService', [
      'getGenres',
      'getGenreById',
      'createGenre',
      'updateGenre',
      'deleteGenre'
    ]);

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', ['confirm']);

    genreServiceMock.getGenres.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [GenresComponent],
      providers: [
        provideHttpClient(),
        { provide: GenreService, useValue: genreServiceMock },
        { provide: ConfirmService, useValue: confirmServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GenresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize signals after ngOnInit', () => {
      // Após ngOnInit, os dados já foram carregados
      expect(component.genresData()).toEqual(mockPaginatedResponse.content);
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.showForm()).toBe(false);
    });

    it('should load genres on init', () => {
      expect(genreServiceMock.getGenres).toHaveBeenCalled();
    });

    it('should set genres data after loading', () => {
      component.ngOnInit();

      expect(component.genresData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
    });
  });

  describe('loadGenres', () => {
    it('should update all signals on successful load', () => {
      component.loadGenres();

      expect(component.genresData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(mockPaginatedResponse.totalPages);
      expect(component.totalElements()).toBe(mockPaginatedResponse.totalElements);
      expect(component.currentPage()).toBe(mockPaginatedResponse.number);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error on load', () => {
      genreServiceMock.getGenres.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadGenres();

      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('error');
    });

    it('should pass search term to service', () => {
      component.searchTerm.set('PlayStation');
      component.loadGenres();

      expect(genreServiceMock.getGenres).toHaveBeenCalledWith(
        0, 10, 'PlayStation'
      );
    });
  });

  describe('Search functionality', () => {
    it('should update isFilterActive computed signal', () => {
      expect(component.isFilterActive()).toBe(false);

      component.searchTerm.set('test');
      expect(component.isFilterActive()).toBe(true);

      component.searchTerm.set('   ');
      expect(component.isFilterActive()).toBe(false);
    });

    it('should reset page to 0 on search', () => {
      component.currentPage.set(5);
      component.onSearch();

      expect(component.currentPage()).toBe(0);
    });

    it('should call loadGenres on search', () => {
      spyOn(component, 'loadGenres');
      component.onSearch();

      expect(component.loadGenres).toHaveBeenCalled();
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('test');
      component.currentPage.set(3);
      spyOn(component, 'loadGenres');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.loadGenres).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page and reload', () => {
      spyOn(component, 'loadGenres');

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(component.loadGenres).toHaveBeenCalled();
    });
  });

  describe('Form operations', () => {
    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingGenre()).toBeNull();
    });

    it('should open edit form with genre data', () => {
      const genre: Genre = { id: 1, name: 'Test Genre' };

      component.editGenre(genre);

      expect(component.showForm()).toBe(true);
      expect(component.editingGenre()).toEqual(genre);
    });

    it('should close form and clear data', () => {
      component.showForm.set(true);
      component.editingGenre.set({ id: 1, name: 'Test' });

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingGenre()).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should create new genre', () => {
      const newGenre: Genre = { name: 'New Genre' };
      genreServiceMock.createGenre.and.returnValue(
        of({ id: 3, name: 'New Genre' })
      );
      spyOn(component, 'loadGenres');

      component.editingGenre.set(null);
      component.onFormSubmit(newGenre);

      expect(genreServiceMock.createGenre).toHaveBeenCalledWith(newGenre);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadGenres).toHaveBeenCalled();
    });

    it('should update existing genre', () => {
      const updatedGenre: Genre = { id: 1, name: 'Updated' };
      genreServiceMock.updateGenre.and.returnValue(of(updatedGenre));
      spyOn(component, 'loadGenres');

      component.editingGenre.set({ id: 1, name: 'Original' });
      component.onFormSubmit(updatedGenre);

      expect(genreServiceMock.updateGenre).toHaveBeenCalledWith(updatedGenre);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadGenres).toHaveBeenCalled();
    });

    it('should handle create error with duplicate name', () => {
      const error = { status: 409, error: {} };
      genreServiceMock.createGenre.and.returnValue(throwError(() => error));

      component.onFormSubmit({ name: 'Duplicate' });

      expect(component.toastMessage()).toBe('Já existe um gênero com este nome');
      expect(component.toastType()).toBe('error');
    });

    it('should delete genre after confirmation', () => {
      const genre: Genre = { id: 1, name: 'To Delete' };
      confirmServiceMock.confirm.and.returnValue(of(true));
      genreServiceMock.deleteGenre.and.returnValue(of(void 0));
      spyOn(component, 'loadGenres');

      component.deleteGenre(genre);

      expect(confirmServiceMock.confirm).toHaveBeenCalled();
      expect(genreServiceMock.deleteGenre).toHaveBeenCalledWith(1);
      expect(component.loadGenres).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      const genre: Genre = { id: 1, name: 'Safe' };
      confirmServiceMock.confirm.and.returnValue(of(false));

      component.deleteGenre(genre);

      expect(genreServiceMock.deleteGenre).not.toHaveBeenCalled();
    });
  });

  describe('Toast notifications', () => {
    it('should show success toast', () => {
      component['showToastMessage']('Success message', 'success');

      expect(component.toastMessage()).toBe('Success message');
      expect(component.toastType()).toBe('success');
      expect(component.showToast()).toBe(true);
    });

    it('should show error toast', () => {
      component['showToastMessage']('Error message', 'error');

      expect(component.toastMessage()).toBe('Error message');
      expect(component.toastType()).toBe('error');
      expect(component.showToast()).toBe(true);
    });
  });

  describe('Signal reactivity', () => {
    it('should react to searchTerm changes', () => {
      expect(component.isFilterActive()).toBe(false);

      component.searchTerm.set('test');
      expect(component.isFilterActive()).toBe(true);

      component.searchTerm.set('');
      expect(component.isFilterActive()).toBe(false);
    });

    it('should update genresData signal', () => {
      const newData: Genre[] = [{ id: 99, name: 'New Item' }];

      component.genresData.set(newData);

      expect(component.genresData()).toEqual(newData);
    });
  });

  describe('Helper methods', () => {
    it('should update search term via helper', () => {
      component.updateSearchTerm('new search');

      expect(component.searchTerm()).toBe('new search');
    });

    it('should handle action callback', () => {
      const mockAction: any = {
        icon: '✏️',
        label: 'Edit',
        callback: jasmine.createSpy('callback')
      };
      const mockItem = { id: 1, name: 'Test' };

      component.handleAction({ action: mockAction, item: mockItem });

      expect(mockAction.callback).toHaveBeenCalledWith(mockItem);
    });
  });
});