import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    
    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // Verifica se não há requisições pendentes
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    const testToken = 'test-jwt-token-12345';
    localStorage.setItem('token', testToken);

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    
    req.flush({});
  });

  it('should not add Authorization header when token does not exist', () => {
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });

  it('should use Bearer token format', () => {
    const testToken = 'my-secret-token';
    localStorage.setItem('token', testToken);

    httpClient.get('/api/platforms').subscribe();

    const req = httpMock.expectOne('/api/platforms');
    const authHeader = req.request.headers.get('Authorization');
    
    expect(authHeader).toContain('Bearer');
    expect(authHeader).toBe(`Bearer ${testToken}`);
    
    req.flush({});
  });

  it('should not modify other headers when adding Authorization', () => {
    const testToken = 'test-token';
    localStorage.setItem('token', testToken);

    httpClient.get('/api/test', {
      headers: {
        'Content-Type': 'application/json',
        'Custom-Header': 'custom-value'
      }
    }).subscribe();

    const req = httpMock.expectOne('/api/test');
    
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
    
    req.flush({});
  });

  it('should work with POST requests', () => {
    const testToken = 'post-token';
    localStorage.setItem('token', testToken);

    const body = { name: 'Test Platform' };
    httpClient.post('/api/platforms', body).subscribe();

    const req = httpMock.expectOne('/api/platforms');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    expect(req.request.body).toEqual(body);
    
    req.flush({});
  });

  it('should work with PUT requests', () => {
    const testToken = 'put-token';
    localStorage.setItem('token', testToken);

    const body = { id: 1, name: 'Updated Platform' };
    httpClient.put('/api/platforms/1', body).subscribe();

    const req = httpMock.expectOne('/api/platforms/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    
    req.flush({});
  });

  it('should work with DELETE requests', () => {
    const testToken = 'delete-token';
    localStorage.setItem('token', testToken);

    httpClient.delete('/api/platforms/1').subscribe();

    const req = httpMock.expectOne('/api/platforms/1');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
    
    req.flush({});
  });

  it('should handle multiple consecutive requests with token', () => {
    const testToken = 'multi-request-token';
    localStorage.setItem('token', testToken);

    httpClient.get('/api/platforms').subscribe();
    httpClient.get('/api/games').subscribe();
    httpClient.post('/api/companies', {}).subscribe();

    const requests = httpMock.match(req => true);
    expect(requests.length).toBe(3);
    
    requests.forEach(req => {
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
      req.flush({});
    });
  });

  it('should handle token change between requests', () => {
    // Primeira requisição com token1
    const token1 = 'first-token';
    localStorage.setItem('token', token1);

    httpClient.get('/api/test1').subscribe();
    
    const req1 = httpMock.expectOne('/api/test1');
    expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${token1}`);
    req1.flush({});

    // Trocar token
    const token2 = 'second-token';
    localStorage.setItem('token', token2);

    httpClient.get('/api/test2').subscribe();
    
    const req2 = httpMock.expectOne('/api/test2');
    expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${token2}`);
    req2.flush({});
  });

  it('should handle removal of token', () => {
    // Primeira requisição com token
    const testToken = 'temporary-token';
    localStorage.setItem('token', testToken);

    httpClient.get('/api/test1').subscribe();
    
    const req1 = httpMock.expectOne('/api/test1');
    expect(req1.request.headers.has('Authorization')).toBe(true);
    req1.flush({});

    // Remover token
    localStorage.removeItem('token');

    httpClient.get('/api/test2').subscribe();
    
    const req2 = httpMock.expectOne('/api/test2');
    expect(req2.request.headers.has('Authorization')).toBe(false);
    req2.flush({});
  });

  it('should not interfere with request without token', () => {
    httpClient.get('/api/public').subscribe();

    const req = httpMock.expectOne('/api/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.method).toBe('GET');
    
    req.flush({});
  });

  it('should handle empty string token', () => {
    localStorage.setItem('token', '');

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    // Token vazio é considerado falsy, então não adiciona header
    expect(req.request.headers.has('Authorization')).toBe(false);
    
    req.flush({});
  });
});