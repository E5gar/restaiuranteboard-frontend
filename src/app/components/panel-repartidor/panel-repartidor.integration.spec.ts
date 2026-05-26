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
import { PanelRepartidorComponent } from './panel-repartidor';

describe('PanelRepartidorComponent integration', () => {
  let fixture: ComponentFixture<PanelRepartidorComponent>;
  let component: PanelRepartidorComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PanelRepartidorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIntegrationRouter(),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).setSession({
      token: testJwt(3600),
      userId: 'repartidor-1',
      role: 'REPARTIDOR',
    });

    fixture = TestBed.createComponent(PanelRepartidorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const boardReq = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/pedidos/repartidor/tablero` &&
        r.params.get('userId') === 'repartidor-1',
    );
    boardReq.flush([]);
    flushCarritoRequest(httpMock, 'repartidor-1');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('loads delivery board on init', async () => {
    await fixture.whenStable();
    expect(component.cargando()).toBe(false);
    expect(component.ordenes().length).toBe(0);
  });
});
