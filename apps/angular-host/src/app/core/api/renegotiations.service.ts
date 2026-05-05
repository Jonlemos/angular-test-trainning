import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Renegotiation {
  id: string;
  userId: string;
  originalChargeId: string;
  amount: number;
  installments: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RenegotiationsService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:3003/api/renegotiations';

  getAll(): Observable<Renegotiation[]> {
    return this.http.get<Renegotiation[]>(this.API);
  }
}
