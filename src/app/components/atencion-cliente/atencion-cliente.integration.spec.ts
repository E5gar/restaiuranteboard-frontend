import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import {
  flushCarritoRequest,
  provideIntegrationRouter,
  testJwt,
} from '../../testing/integration-helpers';
import { AtencionClienteComponent } from './atencion-cliente';

describe('AtencionClienteComponent integration', () => {
  let fixture: ComponentFixture<AtencionClienteComponent>;
  let component: AtencionClienteComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AtencionClienteComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideIntegrationRouter()],
    }).compileComponents();

    TestBed.inject(AuthService).setSession({
      token: testJwt(3600),
      userId: 'u1',
      role: 'CLIENTE',
    });

    fixture = TestBed.createComponent(AtencionClienteComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const ordersReq = httpMock.expectOne(`${environment.apiUrl}/soporte/cliente/pedidos-recientes`);
    ordersReq.flush([
      {
        orderId: 'o1',
        label: 'Pedido #1',
        status: 'ENTREGADO',
        total: 40,
        createdAt: '2026-01-01',
      },
    ]);
    flushCarritoRequest(httpMock, 'u1');
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  it('loads recent orders through SoporteService on init', async () => {
    await fixture.whenStable();
    expect(component.pedidos().length).toBe(1);
    expect(component.pedidos()[0].orderId).toBe('o1');
    expect(component.cargandoPedidos()).toBe(false);
  });

  it('enviarReporte posts multipart ticket via SoporteService', async () => {
    await fixture.whenStable();
    component.paso.set(3);
    component.orderId = 'o1';
    component.categoria = 'PEDIDO_INCOMPLETO';
    component.descripcion = 'Falto una bebida';
    component.enviarReporte();

    const req = httpMock.expectOne(`${environment.apiUrl}/soporte/cliente/tickets`);
    expect(req.request.method).toBe('POST');
    req.flush({ ticketId: 't1', ticketCode: 'TK-001', status: 'ABIERTO' });
    await fixture.whenStable();
    expect(component.ticketCode()).toBe('TK-001');
    expect(component.paso()).toBe(4);
  });
});
