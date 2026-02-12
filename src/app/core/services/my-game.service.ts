import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MyGame, MyGameStatus } from '../models/my-game.model';
import { PaginatedResponse } from '../models/paginated-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MyGameService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/my-games`;

  getMyGames(
    page: number = 0,
    size: number = 10,
    title?: string,
    platformId?: number,
    sourceId?: number,
    statuses?: MyGameStatus[]
  ): Observable<PaginatedResponse<MyGame>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (title) {
      params = params.set('title', title);
    }

    if (platformId) {
      params = params.set('platform_id', platformId.toString());
    }

    if (sourceId) {
      params = params.set('source_id', sourceId.toString());
    }

    if (statuses && statuses.length > 0) {
      params = params.set('status', statuses.join(','));
    }

    return this.http.get<PaginatedResponse<MyGame>>(this.apiUrl, { params });
  }

  getMyGameById(id: number): Observable<MyGame> {
    return this.http.get<MyGame>(`${this.apiUrl}/${id}`);
  }

  createMyGame(myGame: MyGame): Observable<MyGame> {
    return this.http.post<MyGame>(this.apiUrl, myGame);
  }

  changeStatus(id: number, status: MyGameStatus): Observable<MyGame> {
    return this.http.patch<MyGame>(`${this.apiUrl}/${id}/status`, { "status": status.toString() });
  }

  deleteMyGame(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}