import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { FrontendErrorReporterService } from '../services/frontend-error-reporter.service';
import { frontendErrorInterceptor } from './frontend-error.interceptor';

describe('frontendErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let reporter: { report: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reporter = { report: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([frontendErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: FrontendErrorReporterService, useValue: reporter },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('reports http errors to frontend error reporter', () => {
    http.get('/api/catalogo').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/catalogo');
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Internal Server Error' });

    expect(reporter.report).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        source: 'http',
        requestUrl: '/api/catalogo',
        httpStatus: 500,
      }),
    );
  });

  it('does not report errors for client-errors endpoint', () => {
    http.post('/api/client-errors/report', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/client-errors/report');
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Internal Server Error' });

    expect(reporter.report).not.toHaveBeenCalled();
  });
});
