import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CompanyService } from './company.service';
import { Company } from '../models/company.model';
import { PaginatedResponse } from '../models/platform-response.model';
import { environment } from '../../../environments/environment';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  const mockCompany: Company = {
    id: 1,
    name: 'CD Projeck Red'
  };

  const mockCompanies: Company[] = [
    { id: 1, name: 'CD Projeck Red' },
    { id: 2, name: 'Naughty Dog' },
    { id: 3, name: 'Insomniac' }
  ];

  const mockPaginatedResponse: PaginatedResponse<Company> = {
    content: mockCompanies,
    totalElements: 3,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CompanyService]
    });

    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCompanies', () => {
    it('should send GET request with default pagination params', () => {
      service.getCompanies().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with custom page and size', () => {
      service.getCompanies(2, 20).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=2&size=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with name filter', () => {
      const searchName = 'PlayStation';
      service.getCompanies(0, 10, searchName).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/companies?page=0&size=10&name=${searchName}`
      );
      expect(req.request.params.get('name')).toBe(searchName);
      
      req.flush(mockPaginatedResponse);
    });

    it('should not include name param when name is undefined', () => {
      service.getCompanies(0, 10, undefined).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=0&size=10`);
      expect(req.request.params.has('name')).toBe(false);
      
      req.flush(mockPaginatedResponse);
    });

    it('should return paginated response', (done) => {
      service.getCompanies().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(3);
        expect(response.totalElements).toBe(3);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=0&size=10`);
      req.flush(mockPaginatedResponse);
    });

    it('should handle empty results', (done) => {
      const emptyResponse: PaginatedResponse<Company> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getCompanies().subscribe(response => {
        expect(response.content.length).toBe(0);
        expect(response.totalElements).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=0&size=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', (done) => {
      service.getCompanies().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies?page=0&size=10`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getCompanyById', () => {
    it('should send GET request to specific company endpoint', () => {
      const companyId = 1;
      service.getCompanyById(companyId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockCompany);
    });

    it('should return company by id', (done) => {
      const companyId = 1;
      
      service.getCompanyById(companyId).subscribe(company => {
        expect(company).toEqual(mockCompany);
        expect(company.id).toBe(companyId);
        expect(company.name).toBe('CD Projeck Red');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      req.flush(mockCompany);
    });

    it('should handle 404 error for non-existent company', (done) => {
      const companyId = 999;

      service.getCompanyById(companyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createCompany', () => {
    it('should send POST request to create company', () => {
      const newCompany: Company = { name: 'Steam Deck' };
      
      service.createCompany(newCompany).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCompany);
      
      req.flush({ id: 4, ...newCompany });
    });

    it('should return created company with id', (done) => {
      const newCompany: Company = { name: 'Steam Deck' };
      const createdCompany: Company = { id: 4, name: 'Steam Deck' };

      service.createCompany(newCompany).subscribe(company => {
        expect(company).toEqual(createdCompany);
        expect(company.id).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush(createdCompany);
    });

    it('should handle 409 conflict error for duplicate name', (done) => {
      const duplicateCompany: Company = { name: 'CD Projeck Red' };

      service.createCompany(duplicateCompany).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush('Company already exists', { status: 409, statusText: 'Conflict' });
    });

    it('should handle 400 bad request for invalid data', (done) => {
      const invalidCompany: Company = { name: '' };

      service.createCompany(invalidCompany).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateCompany', () => {
    it('should send PUT request to update company', () => {
      const updatedCompany: Company = { id: 1, name: 'CD Projeck Red Pro' };
      
      service.updateCompany(updatedCompany).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedCompany);
      
      req.flush(updatedCompany);
    });

    it('should return updated company', (done) => {
      const updatedCompany: Company = { id: 1, name: 'CD Projeck Red Pro' };

      service.updateCompany(updatedCompany).subscribe(company => {
        expect(company).toEqual(updatedCompany);
        expect(company.name).toBe('CD Projeck Red Pro');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush(updatedCompany);
    });

    it('should handle 404 error for non-existent company', (done) => {
      const nonExistentCompany: Company = { id: 999, name: 'Ghost Console' };

      service.updateCompany(nonExistentCompany).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict for duplicate name on update', (done) => {
      const duplicateName: Company = { id: 1, name: 'Naughty Dog' };

      service.updateCompany(duplicateName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies`);
      req.flush('Name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteCompany', () => {
    it('should send DELETE request to remove company', () => {
      const companyId = 1;
      
      service.deleteCompany(companyId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush(null);
    });

    it('should complete successfully on delete', (done) => {
      const companyId = 1;

      service.deleteCompany(companyId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('should not have failed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent company', (done) => {
      const companyId = 999;

      service.deleteCompany(companyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 forbidden error when user lacks permission', (done) => {
      const companyId = 1;

      service.deleteCompany(companyId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/companies/${companyId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive requests', (done) => {
      let completedRequests = 0;

      service.getCompanies(0, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      service.getCompanies(1, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      const requests = httpMock.match(req => req.url.includes('/companies'));
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockPaginatedResponse));
    });

    it('should handle special characters in search name', () => {
      const specialName = 'Company & Co.';
      service.getCompanies(0, 10, specialName).subscribe();

      const req = httpMock.expectOne(req => 
        req.url.includes('/companies') && req.params.get('name') === specialName
      );
      expect(req.request.params.get('name')).toBe(specialName);
      
      req.flush(mockPaginatedResponse);
    });
  });
});