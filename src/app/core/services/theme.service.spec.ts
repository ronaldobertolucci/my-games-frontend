import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ThemeService } from './theme.service';
import { Theme } from '../models/theme.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('ThemeService', () => {
  let service: ThemeService;
  let httpMock: HttpTestingController;

  const mockTheme: Theme = {
    id: 1,
    name: 'Horror'
  };

  const mockThemes: Theme[] = [
    { id: 1, name: 'Horror' },
    { id: 2, name: 'Fantasy' },
    { id: 3, name: 'Action' }
  ];

  const mockPaginatedResponse: PaginatedResponse<Theme> = {
    content: mockThemes,
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
      providers: [ThemeService]
    });

    service = TestBed.inject(ThemeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getThemes', () => {
    it('should send GET request with default pagination params', () => {
      service.getThemes().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with custom page and size', () => {
      service.getThemes(2, 20).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=2&size=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with name filter', () => {
      const searchName = 'PlayStation';
      service.getThemes(0, 10, searchName).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/themes?page=0&size=10&name=${searchName}`
      );
      expect(req.request.params.get('name')).toBe(searchName);
      
      req.flush(mockPaginatedResponse);
    });

    it('should not include name param when name is undefined', () => {
      service.getThemes(0, 10, undefined).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=0&size=10`);
      expect(req.request.params.has('name')).toBe(false);
      
      req.flush(mockPaginatedResponse);
    });

    it('should return paginated response', (done) => {
      service.getThemes().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(3);
        expect(response.totalElements).toBe(3);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=0&size=10`);
      req.flush(mockPaginatedResponse);
    });

    it('should handle empty results', (done) => {
      const emptyResponse: PaginatedResponse<Theme> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getThemes().subscribe(response => {
        expect(response.content.length).toBe(0);
        expect(response.totalElements).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=0&size=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', (done) => {
      service.getThemes().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes?page=0&size=10`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getThemeById', () => {
    it('should send GET request to specific theme endpoint', () => {
      const themeId = 1;
      service.getThemeById(themeId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockTheme);
    });

    it('should return theme by id', (done) => {
      const themeId = 1;
      
      service.getThemeById(themeId).subscribe(theme => {
        expect(theme).toEqual(mockTheme);
        expect(theme.id).toBe(themeId);
        expect(theme.name).toBe('Horror');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      req.flush(mockTheme);
    });

    it('should handle 404 error for non-existent theme', (done) => {
      const themeId = 999;

      service.getThemeById(themeId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTheme', () => {
    it('should send POST request to create theme', () => {
      const newTheme: Theme = { name: 'Steam Deck' };
      
      service.createTheme(newTheme).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTheme);
      
      req.flush({ id: 4, ...newTheme });
    });

    it('should return created theme with id', (done) => {
      const newTheme: Theme = { name: 'Steam Deck' };
      const createdTheme: Theme = { id: 4, name: 'Steam Deck' };

      service.createTheme(newTheme).subscribe(theme => {
        expect(theme).toEqual(createdTheme);
        expect(theme.id).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush(createdTheme);
    });

    it('should handle 409 conflict error for duplicate name', (done) => {
      const duplicateTheme: Theme = { name: 'Horror' };

      service.createTheme(duplicateTheme).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush('Theme already exists', { status: 409, statusText: 'Conflict' });
    });

    it('should handle 400 bad request for invalid data', (done) => {
      const invalidTheme: Theme = { name: '' };

      service.createTheme(invalidTheme).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTheme', () => {
    it('should send PUT request to update theme', () => {
      const updatedTheme: Theme = { id: 1, name: 'Horror Pro' };
      
      service.updateTheme(updatedTheme).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedTheme);
      
      req.flush(updatedTheme);
    });

    it('should return updated theme', (done) => {
      const updatedTheme: Theme = { id: 1, name: 'Horror Pro' };

      service.updateTheme(updatedTheme).subscribe(theme => {
        expect(theme).toEqual(updatedTheme);
        expect(theme.name).toBe('Horror Pro');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush(updatedTheme);
    });

    it('should handle 404 error for non-existent theme', (done) => {
      const nonExistentTheme: Theme = { id: 999, name: 'Ghost Console' };

      service.updateTheme(nonExistentTheme).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict for duplicate name on update', (done) => {
      const duplicateName: Theme = { id: 1, name: 'Fantasy' };

      service.updateTheme(duplicateName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes`);
      req.flush('Name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteTheme', () => {
    it('should send DELETE request to remove theme', () => {
      const themeId = 1;
      
      service.deleteTheme(themeId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush(null);
    });

    it('should complete successfully on delete', (done) => {
      const themeId = 1;

      service.deleteTheme(themeId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('should not have failed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent theme', (done) => {
      const themeId = 999;

      service.deleteTheme(themeId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 forbidden error when user lacks permission', (done) => {
      const themeId = 1;

      service.deleteTheme(themeId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/themes/${themeId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive requests', (done) => {
      let completedRequests = 0;

      service.getThemes(0, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      service.getThemes(1, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      const requests = httpMock.match(req => req.url.includes('/themes'));
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockPaginatedResponse));
    });

    it('should handle special characters in search name', () => {
      const specialName = 'Theme & Co.';
      service.getThemes(0, 10, specialName).subscribe();

      const req = httpMock.expectOne(req => 
        req.url.includes('/themes') && req.params.get('name') === specialName
      );
      expect(req.request.params.get('name')).toBe(specialName);
      
      req.flush(mockPaginatedResponse);
    });
  });
});