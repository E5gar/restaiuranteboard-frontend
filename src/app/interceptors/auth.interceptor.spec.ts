import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

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

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('adds Authorization header when token is present', () => {
    const token = testJwt(3600);
    auth.setSession({ token, role: 'CLIENTE' });

    http.get('/api/perfil/me').subscribe();

    const req = httpMock.expectOne('/api/perfil/me');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('clears session and navigates to login on 401', () => {
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE' });

    http.get('/api/perfil/me').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/perfil/me');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.getSession()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not clear session on 401 for login endpoint', () => {
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE' });

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.getSession()).not.toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
