import { Injectable } from '@angular/core';

const AUTH_KEY = 'rb_auth';

export type AuthSession = {
  email?: string;
  role?: string;
  firstLogin?: boolean;
  darkMode?: boolean;
  [key: string]: unknown;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  setSession(user: AuthSession): void {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }

  patchSession(partial: Partial<AuthSession>): void {
    const cur = this.getSession();
    if (!cur) return;
    this.setSession({ ...cur, ...partial });
  }

  getSession(): AuthSession | null {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  clearSession(): void {
    sessionStorage.removeItem(AUTH_KEY);
  }

  getPostLoginPath(): string {
    const s = this.getSession();
    if (!s) return '/login';
    if (s.firstLogin === true) return '/confirmar-cuenta';
    switch (s.role) {
      case 'ADMIN':
        return '/gestion-administrador';
      case 'CLIENTE':
        return '/menu';
      case 'CAJERO':
        return '/caja';
      case 'COCINERO':
        return '/cocina';
      case 'REPARTIDOR':
        return '/entregas';
      default:
        return '/login';
    }
  }

  getPostLoginQueryParams(): Record<string, string> | undefined {
    const s = this.getSession();
    if (s?.firstLogin === true && s.email) {
      return { email: String(s.email) };
    }
    return undefined;
  }
}
