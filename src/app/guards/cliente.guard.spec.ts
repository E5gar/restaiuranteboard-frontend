import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { clienteGuard } from './cliente.guard';

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

describe('clienteGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
  });

  it('redirects to login with returnUrl when not logged in', () => {
    const state = { url: '/checkout' } as never;

    const result = TestBed.runInInjectionContext(() => clienteGuard({} as never, state));

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.toString()).toContain('/login');
    expect(tree.queryParams['returnUrl']).toBe('/checkout');
  });

  it('redirects to confirmar-cuenta when firstLogin is true', () => {
    auth.setSession({
      token: testJwt(3600),
      role: 'CLIENTE',
      firstLogin: true,
      email: 'user@gmail.com',
    });

    const result = TestBed.runInInjectionContext(() =>
      clienteGuard({} as never, { url: '/checkout' } as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/confirmar-cuenta');
  });

  it('allows activation when logged in without first login', () => {
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE' });

    const result = TestBed.runInInjectionContext(() =>
      clienteGuard({} as never, { url: '/checkout' } as never),
    );

    expect(result).toBe(true);
  });
});
