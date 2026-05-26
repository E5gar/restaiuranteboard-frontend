import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { cajaGuard } from './caja.guard';

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

describe('cajaGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
  });

  it('allows activation for CAJERO role', () => {
    auth.setSession({ role: 'CAJERO', token: testJwt(3600) });

    const result = TestBed.runInInjectionContext(() => cajaGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('allows activation for ADMIN role', () => {
    auth.setSession({ role: 'ADMIN', token: testJwt(3600) });

    const result = TestBed.runInInjectionContext(() => cajaGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('redirects CLIENTE to login with returnUrl', () => {
    auth.setSession({ role: 'CLIENTE', token: testJwt(3600) });

    const result = TestBed.runInInjectionContext(() => cajaGuard({} as never, {} as never));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/login');
  });
});
