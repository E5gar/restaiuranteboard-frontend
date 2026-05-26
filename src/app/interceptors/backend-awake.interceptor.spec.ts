import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { BackendStatusService } from '../services/backend-status.service';
import { backendAwakeInterceptor } from './backend-awake.interceptor';

describe('backendAwakeInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let backendStatus: { waitUntilAwake: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    backendStatus = {
      waitUntilAwake: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([backendAwakeInterceptor])),
        provideHttpClientTesting(),
        { provide: BackendStatusService, useValue: backendStatus },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('retries request after backend wakes on 503', () => {
    let responseBody: unknown;

    http.get('/api/pedidos').subscribe((body) => {
      responseBody = body;
    });

    const req1 = httpMock.expectOne('/api/pedidos');
    req1.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });

    expect(backendStatus.waitUntilAwake).toHaveBeenCalled();

    const req2 = httpMock.expectOne('/api/pedidos');
    req2.flush({ ok: true });

    expect(responseBody).toEqual({ ok: true });
  });

  it('does not wake backend for ping urls', () => {
    http.get('/api/ping').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/ping');
    req.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });

    expect(backendStatus.waitUntilAwake).not.toHaveBeenCalled();
    httpMock.expectNone('/api/ping');
  });
});
