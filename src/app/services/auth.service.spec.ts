import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function testJwt(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const payload = base64UrlEncode({ exp });
  return `${header}.${payload}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('setSession and getSession', () => {
    it('stores and reads session from sessionStorage', () => {
      const session = { token: testJwt(3600), email: 'a@test.com', role: 'CLIENTE' };

      service.setSession(session);

      expect(service.getSession()).toEqual(session);
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when no session', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true with valid non-expired token', () => {
      service.setSession({ token: testJwt(3600), role: 'CLIENTE' });

      expect(service.isLoggedIn()).toBe(true);
    });

    it('returns false and clears session when token is expired', () => {
      service.setSession({ token: testJwt(-3600), role: 'CLIENTE' });

      expect(service.isLoggedIn()).toBe(false);
      expect(service.getSession()).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session from storage', () => {
      service.setSession({ token: testJwt(3600) });

      service.clearSession();

      expect(service.getSession()).toBeNull();
    });
  });

  describe('destroyAllStorage', () => {
    it('clears sessionStorage and localStorage', () => {
      sessionStorage.setItem('rb_auth', '{}');
      localStorage.setItem('other', '1');

      service.destroyAllStorage();

      expect(sessionStorage.length).toBe(0);
      expect(localStorage.length).toBe(0);
    });
  });

  describe('getPostLoginPath', () => {
    it('returns login when no session', () => {
      expect(service.getPostLoginPath()).toBe('/login');
    });

    it('returns menu for CLIENTE', () => {
      service.setSession({ role: 'CLIENTE', token: testJwt(3600) });

      expect(service.getPostLoginPath()).toBe('/menu');
    });

    it('returns gestion-administrador for ADMIN', () => {
      service.setSession({ role: 'ADMIN', token: testJwt(3600) });

      expect(service.getPostLoginPath()).toBe('/gestion-administrador');
    });

    it('returns confirmar-cuenta when firstLogin is true', () => {
      service.setSession({ role: 'CLIENTE', firstLogin: true, token: testJwt(3600) });

      expect(service.getPostLoginPath()).toBe('/confirmar-cuenta');
    });
  });
});
