import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription, switchMap, catchError, EMPTY } from 'rxjs';
import { AuthService } from './auth.service';

/** Interval (ms) between automatic token refresh calls */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface RefreshResponse {
  token: string;
  user: any;
}

/**
 * TokenRefreshService
 *
 * Polls the backend every 5 minutes to renew the JWT while the user is
 * authenticated. On failure it clears the session and redirects to /login.
 *
 * Lifecycle:
 *  - Call `startPolling()` right after a successful login.
 *  - Call `stopPolling()` on logout (AuthService.logout() triggers this).
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService implements OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  private refreshSubscription: Subscription | null = null;
  private readonly REFRESH_URL = 'http://localhost:3001/api/auth/refresh';

  constructor() {
    // 🚀 Auto-resume polling on app reload if already logged in
    if (this.authService.isAuthenticated()) {
      console.debug('[TokenRefreshService] Resuming polling after reload...');
      this.startPolling();
    }
  }

  /** Start the 5-minute polling loop */
  startPolling(): void {
    // Prevent duplicate timers if called multiple times
    this.stopPolling();

    this.refreshSubscription = interval(REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.http.post<RefreshResponse>(this.REFRESH_URL, {}).pipe(
          catchError((err) => {
            console.warn('[TokenRefreshService] Refresh failed — logging out.', err);
            this.authService.logout();
            return EMPTY;
          })
        ))
      )
      .subscribe({
        next: (response) => {
          // Update the stored token and user info silently
          this.authService.login(response.token, response.user);
          console.debug('[TokenRefreshService] Token refreshed successfully.');
        }
      });
  }

  /** Stop the polling loop (called on logout or destruction) */
  stopPolling(): void {
    this.refreshSubscription?.unsubscribe();
    this.refreshSubscription = null;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
