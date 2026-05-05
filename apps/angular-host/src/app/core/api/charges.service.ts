import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Charge {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChargesService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:3002/api/charges';

  getAll(): Observable<Charge[]> {
    return this.http.get<Charge[]>(this.API);
  }
}
