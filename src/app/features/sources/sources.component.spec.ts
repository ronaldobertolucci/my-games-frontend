import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { SourcesComponent } from './sources.component';
import { SourceService } from '../../core/services/source.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError } from 'rxjs';
import { Source } from '../../core/models/source.model';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('SourcesComponent', () => {
  let component: SourcesComponent;
  let fixture: ComponentFixture<SourcesComponent>;
  let sourceServiceMock: jasmine.SpyObj<SourceService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const mockPaginatedResponse: PaginatedResponse<Source> = {
    content: [
      { id: 1, name: 'Steam' },
      { id: 2, name: 'Epic Games' }
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

    sourceServiceMock = jasmine.createSpyObj('SourceService', [
      'getSources',
      'getSourceById',
      'createSource',
      'updateSource',
      'deleteSource'
    ]);

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', ['confirm']);

    sourceServiceMock.getSources.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [SourcesComponent],
      providers: [
        provideHttpClient(),
        { provide: SourceService, useValue: sourceServiceMock },
        { provide: ConfirmService, useValue: confirmServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize signals after ngOnInit', () => {
      // Após ngOnInit, os dados já foram carregados
      expect(component.sourcesData()).toEqual(mockPaginatedResponse.content);
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.showForm()).toBe(false);
    });

    it('should load sources on init', () => {
      expect(sourceServiceMock.getSources).toHaveBeenCalled();
    });

    it('should set sources data after loading', () => {
      component.ngOnInit();

      expect(component.sourcesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
    });
  });

  describe('loadSources', () => {
    it('should update all signals on successful load', () => {
      component.loadSources();

      expect(component.sourcesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(mockPaginatedResponse.totalPages);
      expect(component.totalElements()).toBe(mockPaginatedResponse.totalElements);
      expect(component.currentPage()).toBe(mockPaginatedResponse.number);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error on load', () => {
      sourceServiceMock.getSources.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadSources();

      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('error');
    });

    it('should pass search term to service', () => {
      component.searchTerm.set('PlayStation');
      component.loadSources();

      expect(sourceServiceMock.getSources).toHaveBeenCalledWith(
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

    it('should call loadSources on search', () => {
      spyOn(component, 'loadSources');
      component.onSearch();

      expect(component.loadSources).toHaveBeenCalled();
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('test');
      component.currentPage.set(3);
      spyOn(component, 'loadSources');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.loadSources).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page and reload', () => {
      spyOn(component, 'loadSources');

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(component.loadSources).toHaveBeenCalled();
    });
  });

  describe('Form operations', () => {
    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingSource()).toBeNull();
    });

    it('should open edit form with source data', () => {
      const source: Source = { id: 1, name: 'Test Source' };

      component.editSource(source);

      expect(component.showForm()).toBe(true);
      expect(component.editingSource()).toEqual(source);
    });

    it('should close form and clear data', () => {
      component.showForm.set(true);
      component.editingSource.set({ id: 1, name: 'Test' });

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingSource()).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should create new source', () => {
      const newSource: Source = { name: 'New Source' };
      sourceServiceMock.createSource.and.returnValue(
        of({ id: 3, name: 'New Source' })
      );
      spyOn(component, 'loadSources');

      component.editingSource.set(null);
      component.onFormSubmit(newSource);

      expect(sourceServiceMock.createSource).toHaveBeenCalledWith(newSource);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadSources).toHaveBeenCalled();
    });

    it('should update existing source', () => {
      const updatedSource: Source = { id: 1, name: 'Updated' };
      sourceServiceMock.updateSource.and.returnValue(of(updatedSource));
      spyOn(component, 'loadSources');

      component.editingSource.set({ id: 1, name: 'Original' });
      component.onFormSubmit(updatedSource);

      expect(sourceServiceMock.updateSource).toHaveBeenCalledWith(updatedSource);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadSources).toHaveBeenCalled();
    });

    it('should handle create error with duplicate name', () => {
      const error = { status: 409, error: {} };
      sourceServiceMock.createSource.and.returnValue(throwError(() => error));

      component.onFormSubmit({ name: 'Duplicate' });

      expect(component.toastMessage()).toBe('Já existe uma origem com este nome');
      expect(component.toastType()).toBe('error');
    });

    it('should delete source after confirmation', () => {
      const source: Source = { id: 1, name: 'To Delete' };
      confirmServiceMock.confirm.and.returnValue(of(true));
      sourceServiceMock.deleteSource.and.returnValue(of(void 0));
      spyOn(component, 'loadSources');

      component.deleteSource(source);

      expect(confirmServiceMock.confirm).toHaveBeenCalled();
      expect(sourceServiceMock.deleteSource).toHaveBeenCalledWith(1);
      expect(component.loadSources).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      const source: Source = { id: 1, name: 'Safe' };
      confirmServiceMock.confirm.and.returnValue(of(false));

      component.deleteSource(source);

      expect(sourceServiceMock.deleteSource).not.toHaveBeenCalled();
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

    it('should update sourcesData signal', () => {
      const newData: Source[] = [{ id: 99, name: 'New Item' }];

      component.sourcesData.set(newData);

      expect(component.sourcesData()).toEqual(newData);
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