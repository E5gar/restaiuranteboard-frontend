import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

const API_INTERACCIONES = 'https://restaiuranteboard-backend.onrender.com/api/interacciones';

@Injectable({ providedIn: 'root' })
export class UserInteractionsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  track(productId: string, action: string, dwellTimeSeconds?: number): void {
    const s = this.auth.getSession();
    if (!s?.userId || (s.role !== 'CLIENTE' && s.role !== 'ADMIN')) {
      return;
    }
    this.http
      .post(API_INTERACCIONES, {
        userId: s.userId,
        productId,
        action,
        dwellTimeSeconds: dwellTimeSeconds ?? null,
      })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }
}
