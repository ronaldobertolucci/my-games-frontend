import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyGameService } from './my-game.service';
import { MyGame, MyGameStatus } from '../models/my-game.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('MyGameService', () => {
  let service: MyGameService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/my-games`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyGameService]
    });
    service = TestBed.inject(MyGameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMyGames', () => {
    it('should fetch paginated my games without filters', () => {
      const mockResponse: PaginatedResponse<MyGame> = {
        content: [
          {
            id: 1,
            user_id: 1,
            game_id: 1,
            platform_id: 1,
            source_id: 1,
            status: 'PLAYING'
          }
        ],
        totalPages: 1,
        totalElements: 1,
        number: 0,
        size: 10,
        first: true,
        last: true
      };

      service.getMyGames().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.content.length).toBe(1);
        expect(response.content[0].status).toBe('PLAYING');
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch my games with title filter', () => {
      const mockResponse: PaginatedResponse<MyGame> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
        first: true,
        last: true
      };

      service.getMyGames(0, 10, 'witcher').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10&title=witcher`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch my games with platform filter', () => {
      const mockResponse: PaginatedResponse<MyGame> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
        first: true,
        last: true
      };

      service.getMyGames(0, 10, undefined, 21).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10&platform_id=21`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch my games with source filter', () => {
      const mockResponse: PaginatedResponse<MyGame> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
        first: true,
        last: true
      };

      service.getMyGames(0, 10, undefined, undefined, 5).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10&source_id=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch my games with all filters', () => {
      const mockResponse: PaginatedResponse<MyGame> = {
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10,
        first: true,
        last: true
      };

      service.getMyGames(1, 20, 'zelda', 3, 2).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&size=20&title=zelda&platform_id=3&source_id=2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getMyGameById', () => {
    it('should fetch a single my game by id', () => {
      const mockMyGame: MyGame = {
        id: 7,
        user_id: 1,
        game_id: 6,
        platform_id: 21,
        source_id: 1,
        status: 'ON_HOLD'
      };

      service.getMyGameById(7).subscribe(myGame => {
        expect(myGame).toEqual(mockMyGame);
        expect(myGame.id).toBe(7);
        expect(myGame.status).toBe('ON_HOLD');
      });

      const req = httpMock.expectOne(`${apiUrl}/7`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMyGame);
    });
  });

  describe('createMyGame', () => {
    it('should create a new my game', () => {
      const newMyGame: MyGame = {
        game_id: 1,
        platform_id: 21,
        source_id: 1,
        status: 'WISHLIST'
      };

      const createdMyGame: MyGame = {
        id: 10,
        user_id: 1,
        ...newMyGame
      };

      service.createMyGame(newMyGame).subscribe(myGame => {
        expect(myGame).toEqual(createdMyGame);
        expect(myGame.id).toBe(10);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newMyGame);
      req.flush(createdMyGame);
    });
  });

  describe('changeStatus', () => {
    it('should update my game status', () => {
      const updatedMyGame: MyGame = {
        id: 7,
        user_id: 1,
        game_id: 6,
        platform_id: 21,
        source_id: 1,
        status: 'COMPLETED'
      };

      service.changeStatus(7, 'COMPLETED').subscribe(myGame => {
        expect(myGame).toEqual(updatedMyGame);
        expect(myGame.status).toBe('COMPLETED');
      });

      const req = httpMock.expectOne(`${apiUrl}/7/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'COMPLETED' });
      req.flush(updatedMyGame);
    });

    it('should handle different status values', () => {
      const statuses: MyGameStatus[] = ['NOT_PLAYED', 'PLAYING', 'COMPLETED', 'ABANDONED', 'ON_HOLD', 'WISHLIST'];

      statuses.forEach((status, index) => {
        const mockResponse: MyGame = {
          id: index + 1,
          user_id: 1,
          game_id: 1,
          platform_id: 1,
          source_id: 1,
          status
        };

        service.changeStatus(index + 1, status).subscribe(myGame => {
          expect(myGame.status).toBe(status);
        });

        const req = httpMock.expectOne(`${apiUrl}/${index + 1}/status`);
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body.status).toBe(status);
        req.flush(mockResponse);
      });
    });
  });

  describe('deleteMyGame', () => {
    it('should delete a my game', () => {
      service.deleteMyGame(7).subscribe(); // ✅ Não precisa verificar nada

      const req = httpMock.expectOne(`${apiUrl}/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('error handling', () => {
    it('should handle 404 error when fetching non-existent my game', () => {
      service.getMyGameById(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/999`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 error when creating duplicate my game', () => {
      const duplicateMyGame: MyGame = {
        game_id: 1,
        platform_id: 21,
        source_id: 1,
        status: 'PLAYING'
      };

      service.createMyGame(duplicateMyGame).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });
});