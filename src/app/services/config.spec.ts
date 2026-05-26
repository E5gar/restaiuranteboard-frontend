import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  const apiBase = environment.apiUrl + '/configuracion';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerConfiguracion', () => {
    it('fetches configuration from api', () => {
      let result: unknown;

      service.obtenerConfiguracion().subscribe((data) => {
        result = data;
      });

      const req = httpMock.expectOne(apiBase);
      expect(req.request.method).toBe('GET');
      req.flush({ configuracionCompleta: true, nombreNegocio: 'Test' });

      expect(result).toEqual({ configuracionCompleta: true, nombreNegocio: 'Test' });
    });
  });

  describe('obtenerEstado', () => {
    it('fetches configuration state from api', () => {
      let result: unknown;

      service.obtenerEstado().subscribe((data) => {
        result = data;
      });

      const req = httpMock.expectOne(`${apiBase}/estado`);
      expect(req.request.method).toBe('GET');
      req.flush({ configuracionCompleta: false });

      expect(result).toEqual({ configuracionCompleta: false });
    });
  });

  describe('enviarVerificacion', () => {
    it('posts smtp verification payload', () => {
      const payload = { emailSmtp: 'a@gmail.com', passwordSmtp: 'abcdefghijklmnop' };

      service.enviarVerificacion(payload).subscribe();

      const req = httpMock.expectOne(`${apiBase}/enviar-verificacion`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'ok' });
    });
  });
});
