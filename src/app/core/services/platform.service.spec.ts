import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlatformService } from './platform.service';
import { Platform } from '../models/platform.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('PlatformService', () => {
  let service: PlatformService;
  let httpMock: HttpTestingController;

  const mockPlatform: Platform = {
    id: 1,
    name: 'PlayStation 5'
  };

  const mockPlatforms: Platform[] = [
    { id: 1, name: 'PlayStation 5' },
    { id: 2, name: 'Xbox Series X' },
    { id: 3, name: 'Nintendo Switch' }
  ];

  const mockPaginatedResponse: PaginatedResponse<Platform> = {
    content: mockPlatforms,
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
      providers: [PlatformService]
    });

    service = TestBed.inject(PlatformService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPlatforms', () => {
    it('should send GET request with default pagination params', () => {
      service.getPlatforms().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with custom page and size', () => {
      service.getPlatforms(2, 20).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=2&size=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with name filter', () => {
      const searchName = 'PlayStation';
      service.getPlatforms(0, 10, searchName).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/platforms?page=0&size=10&name=${searchName}`
      );
      expect(req.request.params.get('name')).toBe(searchName);
      
      req.flush(mockPaginatedResponse);
    });

    it('should not include name param when name is undefined', () => {
      service.getPlatforms(0, 10, undefined).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      expect(req.request.params.has('name')).toBe(false);
      
      req.flush(mockPaginatedResponse);
    });

    it('should return paginated response', (done) => {
      service.getPlatforms().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(3);
        expect(response.totalElements).toBe(3);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      req.flush(mockPaginatedResponse);
    });

    it('should handle empty results', (done) => {
      const emptyResponse: PaginatedResponse<Platform> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getPlatforms().subscribe(response => {
        expect(response.content.length).toBe(0);
        expect(response.totalElements).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', (done) => {
      service.getPlatforms().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms?page=0&size=10`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getPlatformById', () => {
    it('should send GET request to specific platform endpoint', () => {
      const platformId = 1;
      service.getPlatformById(platformId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockPlatform);
    });

    it('should return platform by id', (done) => {
      const platformId = 1;
      
      service.getPlatformById(platformId).subscribe(platform => {
        expect(platform).toEqual(mockPlatform);
        expect(platform.id).toBe(platformId);
        expect(platform.name).toBe('PlayStation 5');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      req.flush(mockPlatform);
    });

    it('should handle 404 error for non-existent platform', (done) => {
      const platformId = 999;

      service.getPlatformById(platformId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createPlatform', () => {
    it('should send POST request to create platform', () => {
      const newPlatform: Platform = { name: 'Steam Deck' };
      
      service.createPlatform(newPlatform).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPlatform);
      
      req.flush({ id: 4, ...newPlatform });
    });

    it('should return created platform with id', (done) => {
      const newPlatform: Platform = { name: 'Steam Deck' };
      const createdPlatform: Platform = { id: 4, name: 'Steam Deck' };

      service.createPlatform(newPlatform).subscribe(platform => {
        expect(platform).toEqual(createdPlatform);
        expect(platform.id).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush(createdPlatform);
    });

    it('should handle 409 conflict error for duplicate name', (done) => {
      const duplicatePlatform: Platform = { name: 'PlayStation 5' };

      service.createPlatform(duplicatePlatform).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush('Platform already exists', { status: 409, statusText: 'Conflict' });
    });

    it('should handle 400 bad request for invalid data', (done) => {
      const invalidPlatform: Platform = { name: '' };

      service.createPlatform(invalidPlatform).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updatePlatform', () => {
    it('should send PUT request to update platform', () => {
      const updatedPlatform: Platform = { id: 1, name: 'PlayStation 5 Pro' };
      
      service.updatePlatform(updatedPlatform).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedPlatform);
      
      req.flush(updatedPlatform);
    });

    it('should return updated platform', (done) => {
      const updatedPlatform: Platform = { id: 1, name: 'PlayStation 5 Pro' };

      service.updatePlatform(updatedPlatform).subscribe(platform => {
        expect(platform).toEqual(updatedPlatform);
        expect(platform.name).toBe('PlayStation 5 Pro');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush(updatedPlatform);
    });

    it('should handle 404 error for non-existent platform', (done) => {
      const nonExistentPlatform: Platform = { id: 999, name: 'Ghost Console' };

      service.updatePlatform(nonExistentPlatform).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict for duplicate name on update', (done) => {
      const duplicateName: Platform = { id: 1, name: 'Xbox Series X' };

      service.updatePlatform(duplicateName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms`);
      req.flush('Name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deletePlatform', () => {
    it('should send DELETE request to remove platform', () => {
      const platformId = 1;
      
      service.deletePlatform(platformId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush(null);
    });

    it('should complete successfully on delete', (done) => {
      const platformId = 1;

      service.deletePlatform(platformId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('should not have failed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent platform', (done) => {
      const platformId = 999;

      service.deletePlatform(platformId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 forbidden error when user lacks permission', (done) => {
      const platformId = 1;

      service.deletePlatform(platformId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/platforms/${platformId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive requests', (done) => {
      let completedRequests = 0;

      service.getPlatforms(0, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      service.getPlatforms(1, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      const requests = httpMock.match(req => req.url.includes('/platforms'));
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockPaginatedResponse));
    });

    it('should handle special characters in search name', () => {
      const specialName = 'Platform & Co.';
      service.getPlatforms(0, 10, specialName).subscribe();

      const req = httpMock.expectOne(req => 
        req.url.includes('/platforms') && req.params.get('name') === specialName
      );
      expect(req.request.params.get('name')).toBe(specialName);
      
      req.flush(mockPaginatedResponse);
    });
  });
});