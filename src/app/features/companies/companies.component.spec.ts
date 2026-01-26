import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CompaniesComponent } from './companies.component';
import { CompanyService } from '../../core/services/company.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { of, throwError } from 'rxjs';
import { Company } from '../../core/models/company.model';
import { PaginatedResponse } from '../../core/models/platform-response.model';

describe('CompaniesComponent', () => {
  let component: CompaniesComponent;
  let fixture: ComponentFixture<CompaniesComponent>;
  let companyServiceMock: jasmine.SpyObj<CompanyService>;
  let confirmServiceMock: jasmine.SpyObj<ConfirmService>;

  const mockPaginatedResponse: PaginatedResponse<Company> = {
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

    companyServiceMock = jasmine.createSpyObj('CompanyService', [
      'getCompanies',
      'getCompanyById',
      'createCompany',
      'updateCompany',
      'deleteCompany'
    ]);

    confirmServiceMock = jasmine.createSpyObj('ConfirmService', ['confirm']);

    companyServiceMock.getCompanies.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      imports: [CompaniesComponent],
      providers: [
        provideHttpClient(),
        { provide: CompanyService, useValue: companyServiceMock },
        { provide: ConfirmService, useValue: confirmServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize signals after ngOnInit', () => {
      // Após ngOnInit, os dados já foram carregados
      expect(component.companiesData()).toEqual(mockPaginatedResponse.content);
      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.isLoading()).toBe(false);
      expect(component.showForm()).toBe(false);
    });

    it('should load companies on init', () => {
      expect(companyServiceMock.getCompanies).toHaveBeenCalled();
    });

    it('should set companies data after loading', () => {
      component.ngOnInit();

      expect(component.companiesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(1);
      expect(component.totalElements()).toBe(2);
    });
  });

  describe('loadCompanies', () => {
    it('should update all signals on successful load', () => {
      component.loadCompanies();

      expect(component.companiesData()).toEqual(mockPaginatedResponse.content);
      expect(component.totalPages()).toBe(mockPaginatedResponse.totalPages);
      expect(component.totalElements()).toBe(mockPaginatedResponse.totalElements);
      expect(component.currentPage()).toBe(mockPaginatedResponse.number);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle error on load', () => {
      companyServiceMock.getCompanies.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadCompanies();

      expect(component.isLoading()).toBe(false);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('error');
    });

    it('should pass search term to service', () => {
      component.searchTerm.set('PlayStation');
      component.loadCompanies();

      expect(companyServiceMock.getCompanies).toHaveBeenCalledWith(
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

    it('should call loadCompanies on search', () => {
      spyOn(component, 'loadCompanies');
      component.onSearch();

      expect(component.loadCompanies).toHaveBeenCalled();
    });

    it('should clear search term and reload', () => {
      component.searchTerm.set('test');
      component.currentPage.set(3);
      spyOn(component, 'loadCompanies');

      component.clearSearch();

      expect(component.searchTerm()).toBe('');
      expect(component.currentPage()).toBe(0);
      expect(component.loadCompanies).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should change page and reload', () => {
      spyOn(component, 'loadCompanies');

      component.onPageChange(2);

      expect(component.currentPage()).toBe(2);
      expect(component.loadCompanies).toHaveBeenCalled();
    });
  });

  describe('Form operations', () => {
    it('should open create form', () => {
      component.openCreateForm();

      expect(component.showForm()).toBe(true);
      expect(component.editingCompany()).toBeNull();
    });

    it('should open edit form with company data', () => {
      const company: Company = { id: 1, name: 'Test Company' };

      component.editCompany(company);

      expect(component.showForm()).toBe(true);
      expect(component.editingCompany()).toEqual(company);
    });

    it('should close form and clear data', () => {
      component.showForm.set(true);
      component.editingCompany.set({ id: 1, name: 'Test' });

      component.closeForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingCompany()).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('should create new company', () => {
      const newCompany: Company = { name: 'New Company' };
      companyServiceMock.createCompany.and.returnValue(
        of({ id: 3, name: 'New Company' })
      );
      spyOn(component, 'loadCompanies');

      component.editingCompany.set(null);
      component.onFormSubmit(newCompany);

      expect(companyServiceMock.createCompany).toHaveBeenCalledWith(newCompany);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadCompanies).toHaveBeenCalled();
    });

    it('should update existing company', () => {
      const updatedCompany: Company = { id: 1, name: 'Updated' };
      companyServiceMock.updateCompany.and.returnValue(of(updatedCompany));
      spyOn(component, 'loadCompanies');

      component.editingCompany.set({ id: 1, name: 'Original' });
      component.onFormSubmit(updatedCompany);

      expect(companyServiceMock.updateCompany).toHaveBeenCalledWith(updatedCompany);
      expect(component.showToast()).toBe(true);
      expect(component.toastType()).toBe('success');
      expect(component.loadCompanies).toHaveBeenCalled();
    });

    it('should handle create error with duplicate name', () => {
      const error = { status: 409, error: {} };
      companyServiceMock.createCompany.and.returnValue(throwError(() => error));

      component.onFormSubmit({ name: 'Duplicate' });

      expect(component.toastMessage()).toBe('Já existe uma plataforma com este nome');
      expect(component.toastType()).toBe('error');
    });

    it('should delete company after confirmation', () => {
      const company: Company = { id: 1, name: 'To Delete' };
      confirmServiceMock.confirm.and.returnValue(of(true));
      companyServiceMock.deleteCompany.and.returnValue(of(void 0));
      spyOn(component, 'loadCompanies');

      component.deleteCompany(company);

      expect(confirmServiceMock.confirm).toHaveBeenCalled();
      expect(companyServiceMock.deleteCompany).toHaveBeenCalledWith(1);
      expect(component.loadCompanies).toHaveBeenCalled();
    });

    it('should not delete if not confirmed', () => {
      const company: Company = { id: 1, name: 'Safe' };
      confirmServiceMock.confirm.and.returnValue(of(false));

      component.deleteCompany(company);

      expect(companyServiceMock.deleteCompany).not.toHaveBeenCalled();
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

    it('should update companiesData signal', () => {
      const newData: Company[] = [{ id: 99, name: 'New Item' }];

      component.companiesData.set(newData);

      expect(component.companiesData()).toEqual(newData);
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