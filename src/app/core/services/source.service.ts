import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Source } from '../models/source.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SourceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sources`;

  getSources(page: number = 0, size: number = 10, name?: string): Observable<PaginatedResponse<Source>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<PaginatedResponse<Source>>(this.apiUrl, { params });
  }

  getSourceById(id: number): Observable<Source> {
    return this.http.get<Source>(`${this.apiUrl}/${id}`);
  }

  createSource(source: Source): Observable<Source> {
    return this.http.post<Source>(this.apiUrl, source);
  }

  updateSource(source: Source): Observable<Source> {
    return this.http.put<Source>(`${this.apiUrl}`, source);
  }

  deleteSource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}