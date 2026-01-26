import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ThemesComponent } from './themes.component';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError } from 'rxjs';
import { Theme } from '../../core/models/theme.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('ThemesComponent', () => {
  let component: ThemesComponent;
  let fixture: ComponentFixture<ThemesComponent>;
  let themeServiceMock: jasmine.SpyObj<ThemeService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const mockPaginatedResponse: PaginatedResponse<Theme> = {
    content: [
      { id: 1, name: 'Horror' },
      { id: 2, name: 'Fantasy' }
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

    themeServiceMock = jasmine.createSpyObj('ThemeService', [
      'getThemes',
      'getThemeById',
      'createTheme',
      'updateTheme',
      'deleteTheme'
    ]);

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', ['confirm']);

    themeServiceMock.getThemes.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [ThemesComponent],
      providers: [
        provideHttpClient(),
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: ConfirmService, useValue: confirmServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize signals after ngOnInit', () => {
      // Após ngOnInit, os dados já foram carregados
      expect(component.themesData()).toEqual(mockPaginatedResponse.content);
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.showForm()).toBe(false);
    });

    it('should load themes on init', () => {
      expect(themeServiceMock.getThemes).toHaveBeenCalled();
    });

    it('should set themes data after loading', () => {
      component.ngOnInit();

      expect(component.themesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
    });
  });

  describe('loadThemes', () => {
    it('should update all signals on successful load', () => {
      component.loadThemes();

      expect(component.themesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(mockPaginatedResponse.totalPages);
      expect(component.totalElements()).toBe(mockPaginatedResponse.totalElements);
      expect(component.currentPage()).toBe(mockPaginatedResponse.number);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error on load', () => {
      themeServiceMock.getThemes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadThemes();

      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('error');
    });

    it('should pass search term to service', () => {
      component.searchTerm.set('PlayStation');
      component.loadThemes();

      expect(themeServiceMock.getThemes).toHaveBeenCalledWith(
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

    it('should call loadThemes on search', () => {
      spyOn(component, 'loadThemes');
      component.onSearch();

      expect(component.loadThemes).toHaveBeenCalled();
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('test');
      component.currentPage.set(3);
      spyOn(component, 'loadThemes');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.loadThemes).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page and reload', () => {
      spyOn(component, 'loadThemes');

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(component.loadThemes).toHaveBeenCalled();
    });
  });

  describe('Form operations', () => {
    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingTheme()).toBeNull();
    });

    it('should open edit form with theme data', () => {
      const theme: Theme = { id: 1, name: 'Test Theme' };

      component.editTheme(theme);

      expect(component.showForm()).toBe(true);
      expect(component.editingTheme()).toEqual(theme);
    });

    it('should close form and clear data', () => {
      component.showForm.set(true);
      component.editingTheme.set({ id: 1, name: 'Test' });

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingTheme()).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should create new theme', () => {
      const newTheme: Theme = { name: 'New Theme' };
      themeServiceMock.createTheme.and.returnValue(
        of({ id: 3, name: 'New Theme' })
      );
      spyOn(component, 'loadThemes');

      component.editingTheme.set(null);
      component.onFormSubmit(newTheme);

      expect(themeServiceMock.createTheme).toHaveBeenCalledWith(newTheme);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadThemes).toHaveBeenCalled();
    });

    it('should update existing theme', () => {
      const updatedTheme: Theme = { id: 1, name: 'Updated' };
      themeServiceMock.updateTheme.and.returnValue(of(updatedTheme));
      spyOn(component, 'loadThemes');

      component.editingTheme.set({ id: 1, name: 'Original' });
      component.onFormSubmit(updatedTheme);

      expect(themeServiceMock.updateTheme).toHaveBeenCalledWith(updatedTheme);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadThemes).toHaveBeenCalled();
    });

    it('should handle create error with duplicate name', () => {
      const error = { status: 409, error: {} };
      themeServiceMock.createTheme.and.returnValue(throwError(() => error));

      component.onFormSubmit({ name: 'Duplicate' });

      expect(component.toastMessage()).toBe('Já existe um tema com este nome');
      expect(component.toastType()).toBe('error');
    });

    it('should delete theme after confirmation', () => {
      const theme: Theme = { id: 1, name: 'To Delete' };
      confirmServiceMock.confirm.and.returnValue(of(true));
      themeServiceMock.deleteTheme.and.returnValue(of(void 0));
      spyOn(component, 'loadThemes');

      component.deleteTheme(theme);

      expect(confirmServiceMock.confirm).toHaveBeenCalled();
      expect(themeServiceMock.deleteTheme).toHaveBeenCalledWith(1);
      expect(component.loadThemes).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      const theme: Theme = { id: 1, name: 'Safe' };
      confirmServiceMock.confirm.and.returnValue(of(false));

      component.deleteTheme(theme);

      expect(themeServiceMock.deleteTheme).not.toHaveBeenCalled();
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

    it('should update themesData signal', () => {
      const newData: Theme[] = [{ id: 99, name: 'New Item' }];

      component.themesData.set(newData);

      expect(component.themesData()).toEqual(newData);
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