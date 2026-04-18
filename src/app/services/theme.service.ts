import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

const AUTH_KEY = 'rb_auth';
const THEME_LS = 'rb_theme_dark';

const API_AUTH = 'https://restaiuranteboard-backend.onrender.com/api/auth';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Ejecutar antes del primer render (APP_INITIALIZER). */
  initSync(): void {
    let fromSession: boolean | null = null;
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (raw) {
      try {
        const s = JSON.parse(raw) as { darkMode?: boolean };
        if (typeof s.darkMode === 'boolean') fromSession = s.darkMode;
      } catch {
        /* ignore */
      }
    }
    const useDark = fromSession ?? localStorage.getItem(THEME_LS) === '1';
    this.applyDark(useDark);
  }

  isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  applyDark(on: boolean): void {
    document.documentElement.classList.toggle('dark', on);
  }

  /** Tras login: preferencia del servidor y caché local alineada. */
  applyFromLogin(darkMode: unknown): void {
    const on = darkMode === true;
    this.applyDark(on);
    localStorage.setItem(THEME_LS, on ? '1' : '0');
  }

  toggle(): void {
    const next = !this.isDark();
    this.applyDark(next);
    localStorage.setItem(THEME_LS, next ? '1' : '0');
    this.auth.patchSession({ darkMode: next });
    const s = this.auth.getSession();
    const email = s?.email != null ? String(s.email) : '';
    if (!email) return;
    this.http.patch(`${API_AUTH}/dark-mode`, { email, darkMode: next }).subscribe({
      error: () => {
        /* silencioso: la UI ya cambió; reintento en próximo login */
      },
    });
  }
}
