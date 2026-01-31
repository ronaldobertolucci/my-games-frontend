import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GameService } from './game.service';
import { Game } from '../models/game.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/games`;

  // Mock de dados
  const mockGame: Game = {
    id: 1,
    title: 'The Legend of Zelda',
    description: 'Action adventure game',
    released_at: '2017-03-03',
    company_id: 1,
    genre_ids: [1, 2],
    theme_ids: [1]
  };

  const mockGames: Game[] = [
    mockGame,
    {
      id: 2,
      title: 'Super Mario Odyssey',
      description: 'Platform game',
      released_at: '2017-10-27',
      company_id: 1,
      genre_ids: [3],
      theme_ids: [2]
    }
  ];

  const mockPaginatedResponse: PaginatedResponse<Game> = {
    content: mockGames,
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GameService]
    });

    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica se não há requisições pendentes
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getGames', () => {
    it('should fetch games with default pagination parameters', () => {
      service.getGames().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
        expect(response.content.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${apiUrl}?page=0&size=10`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should fetch games with custom pagination parameters', () => {
      const page = 2;
      const size = 20;

      service.getGames(page, size).subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne(
        `${apiUrl}?page=${page}&size=${size}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('should fetch games with title filter', () => {
      const title = 'Zelda';

      service.getGames(0, 10, title).subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne(
        `${apiUrl}?page=0&size=10&title=${title}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('title')).toBe(title);
      req.flush(mockPaginatedResponse);
    });

    it('should not include title parameter when not provided', () => {
      service.getGames(0, 10).subscribe();

      const req = httpMock.expectOne(
        `${apiUrl}?page=0&size=10`
      );
      expect(req.request.params.has('title')).toBeFalse();
      req.flush(mockPaginatedResponse);
    });

    it('should handle error when fetching games fails', () => {
      const errorMessage = 'Failed to fetch games';

      service.getGames().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.error).toBe(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getGameById', () => {
    it('should fetch a game by id', () => {
      const gameId = 1;

      service.getGameById(gameId).subscribe(game => {
        expect(game).toEqual(mockGame);
        expect(game.id).toBe(gameId);
        expect(game.title).toBe('The Legend of Zelda');
      });

      const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockGame);
    });

    it('should handle error when game not found', () => {
      const gameId = 999;

      service.getGameById(gameId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
      req.flush('Game not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createGame', () => {
    it('should create a new game', () => {
      const newGame: Game = {
        title: 'New Game',
        description: 'New game description',
        released_at: '2024-01-01',
        company_id: 1,
        genre_ids: [1],
        theme_ids: [1]
      };

      const createdGame: Game = { ...newGame, id: 3 };

      service.createGame(newGame).subscribe(game => {
        expect(game).toEqual(createdGame);
        expect(game.id).toBe(3);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newGame);
      req.flush(createdGame);
    });

    it('should handle validation error when creating game', () => {
      const invalidGame: Game = {
        title: '',
        description: '',
        released_at: '',
        company_id: 0,
        genre_ids: [],
        theme_ids: []
      };

      service.createGame(invalidGame).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateGame', () => {
    it('should update an existing game', () => {
      const updatedGame: Game = {
        ...mockGame,
        title: 'Updated Title',
        description: 'Updated description'
      };

      service.updateGame(updatedGame).subscribe(game => {
        expect(game).toEqual(updatedGame);
        expect(game.title).toBe('Updated Title');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedGame);
      req.flush(updatedGame);
    });

    it('should handle error when updating non-existent game', () => {
      const gameToUpdate: Game = {
        id: 999,
        title: 'Non-existent',
        description: 'Description',
        released_at: '2024-01-01',
        company_id: 1,
        genre_ids: [1],
        theme_ids: [1]
      };

      service.updateGame(gameToUpdate).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush('Game not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteGame', () => {
    it('should delete a game by id', (done) => {
      const gameId = 1;

      service.deleteGame(gameId).subscribe({
        next: (response) => {
          // DELETE com sucesso retorna null quando flush(null)
          expect(response).toBeNull();
          done();
        },
        error: () => {
          fail('should not have failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null); // Simula resposta vazia bem-sucedida
    });

    it('should handle error when deleting non-existent game', () => {
      const gameId = 999;

      service.deleteGame(gameId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
      req.flush('Game not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle error when deletion fails due to constraints', () => {
      const gameId = 1;

      service.deleteGame(gameId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${gameId}`);
      req.flush('Cannot delete game with existing references', { 
        status: 409, 
        statusText: 'Conflict' 
      });
    });
  });
});