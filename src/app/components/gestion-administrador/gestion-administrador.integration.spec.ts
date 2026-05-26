import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import {
  flushCarritoRequest,
  provideIntegrationRouter,
  testJwt,
} from '../../testing/integration-helpers';
import { GestionAdministradorComponent } from './gestion-administrador';

describe('GestionAdministradorComponent integration', () => {
  let fixture: ComponentFixture<GestionAdministradorComponent>;
  let auth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [GestionAdministradorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIntegrationRouter(),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), userId: 'admin-1', role: 'ADMIN' });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GestionAdministradorComponent);
    fixture.detectChanges();
    flushCarritoRequest(httpMock, 'admin-1');
    const soporteReq = httpMock.match(`${environment.apiUrl}/soporte/admin/pendientes-count`);
    soporteReq.forEach((req) => req.flush({ pendientes: 0 }));
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  it('renders admin shell with active session', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(auth.getSession()?.role).toBe('ADMIN');
  });
});
