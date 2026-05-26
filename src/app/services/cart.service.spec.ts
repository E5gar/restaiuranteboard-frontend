import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';

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

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('limpiarLocal', () => {
    it('clears cart lines signal', () => {
      service.applyCarritoResponse({
        items: [
          {
            productId: 'p1',
            name: 'Pizza',
            unitPrice: 10,
            quantity: 2,
            thumbSrc: 'assets/no-image.png',
          },
        ],
      });

      service.limpiarLocal();

      expect(service.items()).toEqual([]);
    });
  });

  describe('clearPriceSnapshot', () => {
    it('removes price snapshot from localStorage', () => {
      localStorage.setItem(
        'rb_cart_precios_snapshot',
        JSON.stringify({ userId: 'u1', lines: [] }),
      );

      service.clearPriceSnapshot();

      expect(localStorage.getItem('rb_cart_precios_snapshot')).toBeNull();
    });
  });

  describe('cargarDesdeServidor', () => {
    it('loads cart from API and updates lines', () => {
      auth.setSession({ token: testJwt(3600), userId: 'user-1', role: 'CLIENTE' });
      let removed: string[] = [];

      service.cargarDesdeServidor('user-1').subscribe((r) => {
        removed = r.removedItems;
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiUrl}/carrito` && r.params.get('userId') === 'user-1',
      );
      req.flush({
        items: [
          {
            productId: 'p1',
            name: 'Ensalada',
            unitPrice: 15,
            quantity: 1,
            thumbSrc: 'assets/no-image.png',
          },
        ],
        removedItems: ['old-item'],
      });

      expect(removed).toEqual(['old-item']);
      expect(service.items().length).toBe(1);
      expect(service.items()[0].name).toBe('Ensalada');
    });

    it('clears local cart when userId is empty', () => {
      service.applyCarritoResponse({
        items: [
          {
            productId: 'p1',
            name: 'X',
            unitPrice: 1,
            quantity: 1,
            thumbSrc: '',
          },
        ],
      });

      service.cargarDesdeServidor('').subscribe();

      expect(service.items()).toEqual([]);
      httpMock.expectNone(`${environment.apiUrl}/carrito`);
    });
  });
});
