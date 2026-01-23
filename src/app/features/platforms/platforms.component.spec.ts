import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlatformsComponent } from './platforms.component';
import { PlatformService } from '../../core/services/platform.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError } from 'rxjs';
import { Platform } from '../../core/models/platform.model';
import { PaginatedResponse } from '../../core/models/platform-response.model';

describe('PlatformsComponent', () => {
  let component: PlatformsComponent;
  let fixture: ComponentFixture<PlatformsComponent>;
  let platformServiceMock: jasmine.SpyObj<PlatformService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const mockPaginatedResponse: PaginatedResponse<Platform> = {
    content: [
      { id: 1, name: 'PlayStation 5' },
      { id: 2, name: 'Xbox Series X' }
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

    platformServiceMock = jasmine.createSpyObj('PlatformService', [
      'getPlatforms',
      'getPlatformById',
      'createPlatform',
      'updatePlatform',
      'deletePlatform'
    ]);

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', ['confirm']);

    platformServiceMock.getPlatforms.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [PlatformsComponent],
      providers: [
        provideHttpClient(),
        { provide: PlatformService, useValue: platformServiceMock },
        { provide: ConfirmService, useValue: confirmServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize signals after ngOnInit', () => {
      // Após ngOnInit, os dados já foram carregados
      expect(component.platformsData()).toEqual(mockPaginatedResponse.content);
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.showForm()).toBe(false);
    });

    it('should load platforms on init', () => {
      expect(platformServiceMock.getPlatforms).toHaveBeenCalled();
    });

    it('should set platforms data after loading', () => {
      component.ngOnInit();

      expect(component.platformsData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
    });
  });

  describe('loadPlatforms', () => {
    it('should update all signals on successful load', () => {
      component.loadPlatforms();

      expect(component.platformsData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(mockPaginatedResponse.totalPages);
      expect(component.totalElements()).toBe(mockPaginatedResponse.totalElements);
      expect(component.currentPage()).toBe(mockPaginatedResponse.number);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error on load', () => {
      platformServiceMock.getPlatforms.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadPlatforms();

      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('error');
    });

    it('should pass search term to service', () => {
      component.searchTerm.set('PlayStation');
      component.loadPlatforms();

      expect(platformServiceMock.getPlatforms).toHaveBeenCalledWith(
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

    it('should call loadPlatforms on search', () => {
      spyOn(component, 'loadPlatforms');
      component.onSearch();

      expect(component.loadPlatforms).toHaveBeenCalled();
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('test');
      component.currentPage.set(3);
      spyOn(component, 'loadPlatforms');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.loadPlatforms).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page and reload', () => {
      spyOn(component, 'loadPlatforms');

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(component.loadPlatforms).toHaveBeenCalled();
    });
  });

  describe('Form operations', () => {
    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingPlatform()).toBeNull();
    });

    it('should open edit form with platform data', () => {
      const platform: Platform = { id: 1, name: 'Test Platform' };

      component.editPlatform(platform);

      expect(component.showForm()).toBe(true);
      expect(component.editingPlatform()).toEqual(platform);
    });

    it('should close form and clear data', () => {
      component.showForm.set(true);
      component.editingPlatform.set({ id: 1, name: 'Test' });

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingPlatform()).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should create new platform', () => {
      const newPlatform: Platform = { name: 'New Platform' };
      platformServiceMock.createPlatform.and.returnValue(
        of({ id: 3, name: 'New Platform' })
      );
      spyOn(component, 'loadPlatforms');

      component.editingPlatform.set(null);
      component.onFormSubmit(newPlatform);

      expect(platformServiceMock.createPlatform).toHaveBeenCalledWith(newPlatform);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadPlatforms).toHaveBeenCalled();
    });

    it('should update existing platform', () => {
      const updatedPlatform: Platform = { id: 1, name: 'Updated' };
      platformServiceMock.updatePlatform.and.returnValue(of(updatedPlatform));
      spyOn(component, 'loadPlatforms');

      component.editingPlatform.set({ id: 1, name: 'Original' });
      component.onFormSubmit(updatedPlatform);

      expect(platformServiceMock.updatePlatform).toHaveBeenCalledWith(updatedPlatform);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadPlatforms).toHaveBeenCalled();
    });

    it('should handle create error with duplicate name', () => {
      const error = { status: 409, error: {} };
      platformServiceMock.createPlatform.and.returnValue(throwError(() => error));

      component.onFormSubmit({ name: 'Duplicate' });

      expect(component.toastMessage()).toBe('Já existe uma plataforma com este nome');
      expect(component.toastType()).toBe('error');
    });

    it('should delete platform after confirmation', () => {
      const platform: Platform = { id: 1, name: 'To Delete' };
      confirmServiceMock.confirm.and.returnValue(of(true));
      platformServiceMock.deletePlatform.and.returnValue(of(void 0));
      spyOn(component, 'loadPlatforms');

      component.deletePlatform(platform);

      expect(confirmServiceMock.confirm).toHaveBeenCalled();
      expect(platformServiceMock.deletePlatform).toHaveBeenCalledWith(1);
      expect(component.loadPlatforms).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      const platform: Platform = { id: 1, name: 'Safe' };
      confirmServiceMock.confirm.and.returnValue(of(false));

      component.deletePlatform(platform);

      expect(platformServiceMock.deletePlatform).not.toHaveBeenCalled();
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

    it('should update platformsData signal', () => {
      const newData: Platform[] = [{ id: 99, name: 'New Item' }];

      component.platformsData.set(newData);

      expect(component.platformsData()).toEqual(newData);
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