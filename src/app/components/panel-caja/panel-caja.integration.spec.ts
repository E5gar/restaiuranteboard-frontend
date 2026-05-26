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
import { PanelCajaComponent } from './panel-caja';

describe('PanelCajaComponent integration', () => {
  let fixture: ComponentFixture<PanelCajaComponent>;
  let component: PanelCajaComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PanelCajaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIntegrationRouter(),
        {
          provide: WebsocketService,
          useValue: {
            subscribeToTopic: () => EMPTY,
          },
        },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).setSession({
      token: testJwt(3600),
      userId: 'cajero-1',
      role: 'CAJERO',
    });

    fixture = TestBed.createComponent(PanelCajaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const listReq = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/pedidos/caja/pendientes` &&
        r.params.get('processorUserId') === 'cajero-1',
    );
    listReq.flush([
      {
        id: 'ord-1',
        createdAt: '2026-01-01T10:00:00',
        clienteNombre: 'Cliente',
        total: '50.00',
      },
    ]);
    flushCarritoRequest(httpMock, 'cajero-1');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('loads pending payment orders on init', async () => {
    await fixture.whenStable();
    expect(component.ordenes().length).toBe(1);
    expect(component.ordenes()[0].id).toBe('ord-1');
    expect(component.cargandoLista()).toBe(false);
  });
});
