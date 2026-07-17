import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleCodeResponse = {
  code?: string;
  error?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
};

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private scriptPromise: Promise<void> | null = null;

  get enabled(): boolean {
    return !!environment.googleClientId?.trim();
  }

  loadScript(): Promise<void> {
    if (this.scriptPromise) {
      return this.scriptPromise;
    }
    this.scriptPromise = new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-rb-google-gsi]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Sign-In')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['rbGoogleGsi'] = '1';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Google Sign-In'));
      document.head.appendChild(script);
    });
    return this.scriptPromise;
  }

  async requestAuth(): Promise<{ idToken?: string; code?: string }> {
    if (!this.enabled) {
      throw new Error('Inicio de sesión con Google no está configurado.');
    }
    await this.loadScript();
    try {
      const idToken = await this.requestIdTokenPrompt();
      return { idToken };
    } catch {
      const code = await this.requestAuthCodePopup();
      return { code };
    }
  }

  decodeJwtPayload(
    credential: string,
  ): { email: string; givenName: string; familyName: string } | null {
    try {
      const part = credential.split('.')[1];
      if (!part) {
        return null;
      }
      const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))); // NOSONAR
      return {
        email: String(json.email || ''),
        givenName: String(json.given_name || ''),
        familyName: String(json.family_name || ''),
      };
    } catch {
      return null;
    }
  }

  private requestIdTokenPrompt(): Promise<string> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const clientId = environment.googleClientId.trim();
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => {
          if (settled) {
            return;
          }
          settled = true;
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Autenticación cancelada'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google!.accounts.id.prompt((notification: GooglePromptNotification) => {
        if (settled) {
          return;
        }
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          settled = true;
          reject(
            new Error(
              notification.getNotDisplayedReason() || notification.getSkippedReason() || 'prompt_unavailable',
            ),
          );
        }
      });
    });
  }

  private requestAuthCodePopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      const clientId = environment.googleClientId.trim();
      const client = window.google!.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: (response: GoogleCodeResponse) => {
          if (response.code) {
            resolve(response.code);
          } else {
            reject(new Error(response.error || 'Autenticación cancelada'));
          }
        },
      });
      client.requestCode();
    });
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (listener?: (notification: GooglePromptNotification) => void) => void;
        };
        oauth2: {
          initCodeClient: (config: Record<string, unknown>) => { requestCode: () => void };
        };
      };
    };
  }
}
