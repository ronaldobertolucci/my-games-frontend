import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Genre } from '../models/genre.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/genres`;

  getGenres(page: number = 0, size: number = 10, name?: string): Observable<PaginatedResponse<Genre>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<PaginatedResponse<Genre>>(this.apiUrl, { params });
  }

  getGenreById(id: number): Observable<Genre> {
    return this.http.get<Genre>(`${this.apiUrl}/${id}`);
  }

  createGenre(genre: Genre): Observable<Genre> {
    return this.http.post<Genre>(this.apiUrl, genre);
  }

  updateGenre(genre: Genre): Observable<Genre> {
    return this.http.put<Genre>(`${this.apiUrl}`, genre);
  }

  deleteGenre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}