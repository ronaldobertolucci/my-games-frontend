import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Platform } from '../models/platform.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/platforms`;

  getPlatforms(page: number = 0, size: number = 10, name?: string): Observable<PaginatedResponse<Platform>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (name) {
      params = params.set('name', name);
    }

    return this.http.get<PaginatedResponse<Platform>>(this.apiUrl, { params });
  }

  getPlatformById(id: number): Observable<Platform> {
    return this.http.get<Platform>(`${this.apiUrl}/${id}`);
  }

  createPlatform(platform: Platform): Observable<Platform> {
    return this.http.post<Platform>(this.apiUrl, platform);
  }

  updatePlatform(platform: Platform): Observable<Platform> {
    return this.http.put<Platform>(`${this.apiUrl}`, platform);
  }

  deletePlatform(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}