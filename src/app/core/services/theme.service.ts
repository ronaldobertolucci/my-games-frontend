import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Theme } from '../models/theme.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/themes`;

  getThemes(page: number = 0, size: number = 10, name?: string): Observable<PaginatedResponse<Theme>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<PaginatedResponse<Theme>>(this.apiUrl, { params });
  }

  getThemeById(id: number): Observable<Theme> {
    return this.http.get<Theme>(`${this.apiUrl}/${id}`);
  }

  createTheme(theme: Theme): Observable<Theme> {
    return this.http.post<Theme>(this.apiUrl, theme);
  }

  updateTheme(theme: Theme): Observable<Theme> {
    return this.http.put<Theme>(`${this.apiUrl}`, theme);
  }

  deleteTheme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}