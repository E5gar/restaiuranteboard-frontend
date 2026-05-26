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
import { PanelCocinaComponent } from './panel-cocina';

describe('PanelCocinaComponent integration', () => {
  let fixture: ComponentFixture<PanelCocinaComponent>;
  let component: PanelCocinaComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PanelCocinaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIntegrationRouter(),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    TestBed.inject(AuthService).setSession({
      token: testJwt(3600),
      userId: 'cocinero-1',
      role: 'COCINERO',
    });

    fixture = TestBed.createComponent(PanelCocinaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const boardReq = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/pedidos/cocina/tablero` &&
        r.params.get('userId') === 'cocinero-1',
    );
    boardReq.flush([]);
    flushCarritoRequest(httpMock, 'cocinero-1');
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('loads kitchen board on init', async () => {
    await fixture.whenStable();
    expect(component.cargando()).toBe(false);
    expect(component.ordenes().length).toBe(0);
  });
});
