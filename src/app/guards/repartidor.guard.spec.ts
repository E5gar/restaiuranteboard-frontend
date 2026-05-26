import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { repartidorGuard } from './repartidor.guard';

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

describe('repartidorGuard', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
  });

  it('allows activation for REPARTIDOR role', () => {
    auth.setSession({ role: 'REPARTIDOR', token: testJwt(3600) });

    const result = TestBed.runInInjectionContext(() =>
      repartidorGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it('redirects CLIENTE to login with entregas returnUrl', () => {
    auth.setSession({ role: 'CLIENTE', token: testJwt(3600) });

    const result = TestBed.runInInjectionContext(() =>
      repartidorGuard({} as never, {} as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/login');
  });
});
