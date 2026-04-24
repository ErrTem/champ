import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FighterListItem, FighterProfile } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getFighters(): Observable<FighterListItem[]> {
    return this.http.get<FighterListItem[]>(`${this.baseUrl}/fighters`, { withCredentials: true });
  }

  getFighterProfile(fighterId: string): Observable<FighterProfile> {
    return this.http.get<FighterProfile>(`${this.baseUrl}/fighters/${fighterId}`, {
      withCredentials: true,
    });
  }
}

