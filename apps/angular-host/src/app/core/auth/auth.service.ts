import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  name: string;
  email: string;
  document: string; // CPF/CNPJ
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(this.getStoredToken());

  public user = this.userSignal.asReadonly();
  public isAuthenticated = computed(() => !!this.tokenSignal());
  public token = this.tokenSignal.asReadonly();

  constructor() {
    this.initSessionFromStorage();
    // Listen for storage events to sync login across tabs or remote apps
    window.addEventListener('storage', (event) => {
      if (event.key === 'jwt_token') {
        this.tokenSignal.set(event.newValue);
        this.initSessionFromStorage();
      }
    });
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  }

  private initSessionFromStorage() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.userSignal.set(user);
    } else {
      this.clearSession();
    }
  }

  login(token: string, user: User) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  logout() {
    this.clearSession();
    // In a real app we might redirect to the login remote
    window.location.reload();
  }

  private clearSession() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}
