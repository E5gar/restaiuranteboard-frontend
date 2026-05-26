import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { SoporteService } from './soporte.service';

describe('SoporteService', () => {
  let service: SoporteService;
  let httpMock: HttpTestingController;

  const apiBase = environment.apiUrl + '/soporte';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SoporteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('pedidosRecientes', () => {
    it('fetches recent orders for client', () => {
      let result: unknown;

      service.pedidosRecientes().subscribe((data) => {
        result = data;
      });

      const req = httpMock.expectOne(`${apiBase}/cliente/pedidos-recientes`);
      expect(req.request.method).toBe('GET');
      req.flush([{ orderId: 'o1', label: 'Pedido 1' }]);

      expect(result).toEqual([{ orderId: 'o1', label: 'Pedido 1' }]);
    });
  });

  describe('pendientesCount', () => {
    it('fetches pending tickets count for admin', () => {
      let result: unknown;

      service.pendientesCount().subscribe((data) => {
        result = data;
      });

      const req = httpMock.expectOne(`${apiBase}/admin/pendientes-count`);
      expect(req.request.method).toBe('GET');
      req.flush({ pendientes: 3 });

      expect(result).toEqual({ pendientes: 3 });
    });
  });
});
