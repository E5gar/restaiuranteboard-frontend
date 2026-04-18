import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

const AUTH_KEY = 'rb_auth';
/** Preferencia persistida en BD (espejo local solo con sesión iniciada). */
const THEME_LS = 'rb_theme_dark';
/** Preferencia temporal solo en navegación sin sesión (se pierde al cerrar pestaña). */
const GUEST_THEME_SS = 'rb_guest_dark';

const API_AUTH = 'https://restaiuranteboard-backend.onrender.com/api/auth';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Sin sesión → claro salvo vista previa temporal en la misma pestaña. Con sesión → `darkMode` en sesión o espejo local. */
  initSync(): void {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) {
      this.applyDark(sessionStorage.getItem(GUEST_THEME_SS) === '1');
      return;
    }
    try {
      const s = JSON.parse(raw) as { darkMode?: boolean };
      if (typeof s.darkMode === 'boolean') {
        this.applyDark(s.darkMode);
        return;
      }
    } catch {
      /* ignore */
    }
    this.applyDark(localStorage.getItem(THEME_LS) === '1');
  }

  isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  applyDark(on: boolean): void {
    document.documentElement.classList.toggle('dark', on);
  }

  /**
   * Tras `setSession` con `darkMode` ya fusionado (invitado vs servidor):
   * aplica tema, espejo local y persiste en BD.
   */
  persistLoginTheme(dark: boolean, email: string): void {
    this.applyDark(dark);
    localStorage.setItem(THEME_LS, dark ? '1' : '0');
    if (!email) return;
    this.http.patch(`${API_AUTH}/dark-mode`, { email, darkMode: dark }).subscribe({
      error: () => {
        /* silencioso */
      },
    });
  }

  /** Invitado: solo sessionStorage. Con sesión: localStorage + sesión + BD. */
  toggle(): void {
    const next = !this.isDark();
    this.applyDark(next);

    const raw = sessionStorage.getItem(AUTH_KEY);
    const loggedIn = !!raw;

    if (!loggedIn) {
      sessionStorage.setItem(GUEST_THEME_SS, next ? '1' : '0');
      return;
    }

    localStorage.setItem(THEME_LS, next ? '1' : '0');
    this.auth.patchSession({ darkMode: next });

    let email = '';
    try {
      const s = JSON.parse(raw!) as { email?: string };
      if (s.email) email = String(s.email);
    } catch {
      /* ignore */
    }
    if (!email) return;

    this.http.patch(`${API_AUTH}/dark-mode`, { email, darkMode: next }).subscribe({
      error: () => {
        /* silencioso */
      },
    });
  }

  /** Cerrar sesión: tema claro y limpiar cachés de tema en cliente. */
  onLogout(): void {
    sessionStorage.removeItem(GUEST_THEME_SS);
    localStorage.removeItem(THEME_LS);
    this.applyDark(false);
  }
}
