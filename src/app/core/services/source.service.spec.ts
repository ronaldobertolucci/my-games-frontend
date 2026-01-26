import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SourceService } from './source.service';
import { Source } from '../models/source.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('SourceService', () => {
  let service: SourceService;
  let httpMock: HttpTestingController;

  const mockSource: Source = {
    id: 1,
    name: 'Epic Games'
  };

  const mockSources: Source[] = [
    { id: 1, name: 'Epic Games' },
    { id: 2, name: 'Steam' },
    { id: 3, name: 'Blizzard' }
  ];

  const mockPaginatedResponse: PaginatedResponse<Source> = {
    content: mockSources,
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
      providers: [SourceService]
    });

    service = TestBed.inject(SourceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSources', () => {
    it('should send GET request with default pagination params', () => {
      service.getSources().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with custom page and size', () => {
      service.getSources(2, 20).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=2&size=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with name filter', () => {
      const searchName = 'PlayStation';
      service.getSources(0, 10, searchName).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/sources?page=0&size=10&name=${searchName}`
      );
      expect(req.request.params.get('name')).toBe(searchName);
      
      req.flush(mockPaginatedResponse);
    });

    it('should not include name param when name is undefined', () => {
      service.getSources(0, 10, undefined).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=0&size=10`);
      expect(req.request.params.has('name')).toBe(false);
      
      req.flush(mockPaginatedResponse);
    });

    it('should return paginated response', (done) => {
      service.getSources().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(3);
        expect(response.totalElements).toBe(3);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=0&size=10`);
      req.flush(mockPaginatedResponse);
    });

    it('should handle empty results', (done) => {
      const emptyResponse: PaginatedResponse<Source> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getSources().subscribe(response => {
        expect(response.content.length).toBe(0);
        expect(response.totalElements).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=0&size=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', (done) => {
      service.getSources().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources?page=0&size=10`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getSourceById', () => {
    it('should send GET request to specific source endpoint', () => {
      const sourceId = 1;
      service.getSourceById(sourceId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockSource);
    });

    it('should return source by id', (done) => {
      const sourceId = 1;
      
      service.getSourceById(sourceId).subscribe(source => {
        expect(source).toEqual(mockSource);
        expect(source.id).toBe(sourceId);
        expect(source.name).toBe('Epic Games');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      req.flush(mockSource);
    });

    it('should handle 404 error for non-existent source', (done) => {
      const sourceId = 999;

      service.getSourceById(sourceId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createSource', () => {
    it('should send POST request to create source', () => {
      const newSource: Source = { name: 'Steam Deck' };
      
      service.createSource(newSource).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newSource);
      
      req.flush({ id: 4, ...newSource });
    });

    it('should return created source with id', (done) => {
      const newSource: Source = { name: 'Steam Deck' };
      const createdSource: Source = { id: 4, name: 'Steam Deck' };

      service.createSource(newSource).subscribe(source => {
        expect(source).toEqual(createdSource);
        expect(source.id).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush(createdSource);
    });

    it('should handle 409 conflict error for duplicate name', (done) => {
      const duplicateSource: Source = { name: 'Epic Games' };

      service.createSource(duplicateSource).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush('Source already exists', { status: 409, statusText: 'Conflict' });
    });

    it('should handle 400 bad request for invalid data', (done) => {
      const invalidSource: Source = { name: '' };

      service.createSource(invalidSource).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateSource', () => {
    it('should send PUT request to update source', () => {
      const updatedSource: Source = { id: 1, name: 'Epic Games Pro' };
      
      service.updateSource(updatedSource).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedSource);
      
      req.flush(updatedSource);
    });

    it('should return updated source', (done) => {
      const updatedSource: Source = { id: 1, name: 'Epic Games Pro' };

      service.updateSource(updatedSource).subscribe(source => {
        expect(source).toEqual(updatedSource);
        expect(source.name).toBe('Epic Games Pro');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush(updatedSource);
    });

    it('should handle 404 error for non-existent source', (done) => {
      const nonExistentSource: Source = { id: 999, name: 'Ghost Console' };

      service.updateSource(nonExistentSource).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict for duplicate name on update', (done) => {
      const duplicateName: Source = { id: 1, name: 'Steam' };

      service.updateSource(duplicateName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources`);
      req.flush('Name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteSource', () => {
    it('should send DELETE request to remove source', () => {
      const sourceId = 1;
      
      service.deleteSource(sourceId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush(null);
    });

    it('should complete successfully on delete', (done) => {
      const sourceId = 1;

      service.deleteSource(sourceId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('should not have failed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent source', (done) => {
      const sourceId = 999;

      service.deleteSource(sourceId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 forbidden error when user lacks permission', (done) => {
      const sourceId = 1;

      service.deleteSource(sourceId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/sources/${sourceId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive requests', (done) => {
      let completedRequests = 0;

      service.getSources(0, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      service.getSources(1, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      const requests = httpMock.match(req => req.url.includes('/sources'));
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockPaginatedResponse));
    });

    it('should handle special characters in search name', () => {
      const specialName = 'Source & Co.';
      service.getSources(0, 10, specialName).subscribe();

      const req = httpMock.expectOne(req => 
        req.url.includes('/sources') && req.params.get('name') === specialName
      );
      expect(req.request.params.get('name')).toBe(specialName);
      
      req.flush(mockPaginatedResponse);
    });
  });
});