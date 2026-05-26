import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHeaders, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { MaintenanceService } from '../services/maintenance.service';
import { maintenanceInterceptor } from './maintenance.interceptor';

describe('maintenanceInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let maintenance: MaintenanceService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([maintenanceInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    maintenance = TestBed.inject(MaintenanceService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    Object.defineProperty(router, 'url', { value: '/menu', writable: true });
  });

  afterEach(() => {
    httpMock.verify();
    maintenance.end();
  });

  it('starts maintenance and navigates on 503 with X-Maintenance header', () => {
    http.get('/api/health').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/health');
    req.flush(
      { message: 'Maintenance' },
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new HttpHeaders({ 'X-Maintenance': 'true' }),
      },
    );

    expect(maintenance.active()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/mantenimiento']);
  });

  it('does not navigate when already on mantenimiento route', () => {
    Object.defineProperty(router, 'url', { value: '/mantenimiento', writable: true });

    http.get('/api/health').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/health');
    req.flush(
      { message: 'Maintenance' },
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new HttpHeaders({ 'X-Maintenance': 'true' }),
      },
    );

    expect(maintenance.active()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('rethrows error when not a maintenance response', () => {
    let status = 0;

    http.get('/api/health').subscribe({
      error: (err) => {
        status = err.status;
      },
    });

    const req = httpMock.expectOne('/api/health');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(status).toBe(500);
    expect(maintenance.active()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
