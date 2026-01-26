import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GenreService } from './genre.service';
import { Genre } from '../models/genre.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('GenreService', () => {
  let service: GenreService;
  let httpMock: HttpTestingController;

  const mockGenre: Genre = {
    id: 1,
    name: 'Shooter'
  };

  const mockGenres: Genre[] = [
    { id: 1, name: 'Shooter' },
    { id: 2, name: 'Adventure' },
    { id: 3, name: 'Racing' }
  ];

  const mockPaginatedResponse: PaginatedResponse<Genre> = {
    content: mockGenres,
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
      providers: [GenreService]
    });

    service = TestBed.inject(GenreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGenres', () => {
    it('should send GET request with default pagination params', () => {
      service.getGenres().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('10');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with custom page and size', () => {
      service.getGenres(2, 20).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=2&size=20`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('20');
      
      req.flush(mockPaginatedResponse);
    });

    it('should send GET request with name filter', () => {
      const searchName = 'PlayStation';
      service.getGenres(0, 10, searchName).subscribe();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/genres?page=0&size=10&name=${searchName}`
      );
      expect(req.request.params.get('name')).toBe(searchName);
      
      req.flush(mockPaginatedResponse);
    });

    it('should not include name param when name is undefined', () => {
      service.getGenres(0, 10, undefined).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=0&size=10`);
      expect(req.request.params.has('name')).toBe(false);
      
      req.flush(mockPaginatedResponse);
    });

    it('should return paginated response', (done) => {
      service.getGenres().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(3);
        expect(response.totalElements).toBe(3);
        expect(response.totalPages).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=0&size=10`);
      req.flush(mockPaginatedResponse);
    });

    it('should handle empty results', (done) => {
      const emptyResponse: PaginatedResponse<Genre> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true
      };

      service.getGenres().subscribe(response => {
        expect(response.content.length).toBe(0);
        expect(response.totalElements).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=0&size=10`);
      req.flush(emptyResponse);
    });

    it('should handle HTTP error', (done) => {
      service.getGenres().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres?page=0&size=10`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getGenreById', () => {
    it('should send GET request to specific genre endpoint', () => {
      const genreId = 1;
      service.getGenreById(genreId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(mockGenre);
    });

    it('should return genre by id', (done) => {
      const genreId = 1;
      
      service.getGenreById(genreId).subscribe(genre => {
        expect(genre).toEqual(mockGenre);
        expect(genre.id).toBe(genreId);
        expect(genre.name).toBe('Shooter');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      req.flush(mockGenre);
    });

    it('should handle 404 error for non-existent genre', (done) => {
      const genreId = 999;

      service.getGenreById(genreId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createGenre', () => {
    it('should send POST request to create genre', () => {
      const newGenre: Genre = { name: 'Steam Deck' };
      
      service.createGenre(newGenre).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newGenre);
      
      req.flush({ id: 4, ...newGenre });
    });

    it('should return created genre with id', (done) => {
      const newGenre: Genre = { name: 'Steam Deck' };
      const createdGenre: Genre = { id: 4, name: 'Steam Deck' };

      service.createGenre(newGenre).subscribe(genre => {
        expect(genre).toEqual(createdGenre);
        expect(genre.id).toBeDefined();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush(createdGenre);
    });

    it('should handle 409 conflict error for duplicate name', (done) => {
      const duplicateGenre: Genre = { name: 'Shooter' };

      service.createGenre(duplicateGenre).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush('Genre already exists', { status: 409, statusText: 'Conflict' });
    });

    it('should handle 400 bad request for invalid data', (done) => {
      const invalidGenre: Genre = { name: '' };

      service.createGenre(invalidGenre).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateGenre', () => {
    it('should send PUT request to update genre', () => {
      const updatedGenre: Genre = { id: 1, name: 'Shooter Pro' };
      
      service.updateGenre(updatedGenre).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedGenre);
      
      req.flush(updatedGenre);
    });

    it('should return updated genre', (done) => {
      const updatedGenre: Genre = { id: 1, name: 'Shooter Pro' };

      service.updateGenre(updatedGenre).subscribe(genre => {
        expect(genre).toEqual(updatedGenre);
        expect(genre.name).toBe('Shooter Pro');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush(updatedGenre);
    });

    it('should handle 404 error for non-existent genre', (done) => {
      const nonExistentGenre: Genre = { id: 999, name: 'Ghost Console' };

      service.updateGenre(nonExistentGenre).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict for duplicate name on update', (done) => {
      const duplicateName: Genre = { id: 1, name: 'Adventure' };

      service.updateGenre(duplicateName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres`);
      req.flush('Name already exists', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteGenre', () => {
    it('should send DELETE request to remove genre', () => {
      const genreId = 1;
      
      service.deleteGenre(genreId).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush(null);
    });

    it('should complete successfully on delete', (done) => {
      const genreId = 1;

      service.deleteGenre(genreId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: () => fail('should not have failed')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      req.flush(null);
    });

    it('should handle 404 error when deleting non-existent genre', (done) => {
      const genreId = 999;

      service.deleteGenre(genreId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 forbidden error when user lacks permission', (done) => {
      const genreId = 1;

      service.deleteGenre(genreId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/genres/${genreId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple consecutive requests', (done) => {
      let completedRequests = 0;

      service.getGenres(0, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      service.getGenres(1, 10).subscribe(() => {
        completedRequests++;
        if (completedRequests === 2) done();
      });

      const requests = httpMock.match(req => req.url.includes('/genres'));
      expect(requests.length).toBe(2);
      
      requests.forEach(req => req.flush(mockPaginatedResponse));
    });

    it('should handle special characters in search name', () => {
      const specialName = 'Genre & Co.';
      service.getGenres(0, 10, specialName).subscribe();

      const req = httpMock.expectOne(req => 
        req.url.includes('/genres') && req.params.get('name') === specialName
      );
      expect(req.request.params.get('name')).toBe(specialName);
      
      req.flush(mockPaginatedResponse);
    });
  });
});