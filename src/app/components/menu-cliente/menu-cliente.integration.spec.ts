import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EMPTY } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { flushMenuClienteExtras, provideIntegrationRouter, testJwt } from '../../testing/integration-helpers';
import { MenuClienteComponent } from './menu-cliente';

describe('MenuClienteComponent integration', () => {
  let fixture: ComponentFixture<MenuClienteComponent>;
  let component: MenuClienteComponent;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MenuClienteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideIntegrationRouter(),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), userId: 'u1', role: 'CLIENTE', email: 'c@gmail.com' });

    fixture = TestBed.createComponent(MenuClienteComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const menuReq = httpMock.expectOne(`${environment.apiUrl}/catalogo/productos/menu/base`);
    menuReq.flush({
      productos: [
        {
          id: 'p1',
          name: 'Pizza',
          price: 25,
          category: 'Plato Principal',
          description: 'Queso',
          imagesBase64: [],
        },
      ],
    });

    flushMenuClienteExtras(httpMock, 'u1');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('loads catalog and exposes products in component', async () => {
    await fixture.whenStable();
    expect(component.productos().length).toBe(1);
    expect(component.productos()[0].name).toBe('Pizza');
    expect(component.cargando).toBe(false);
  });

  it('productosFiltrados filters by search text', async () => {
    await fixture.whenStable();
    component.busqueda = 'pizza';
    const filtered = component.productosFiltrados;
    expect(filtered.length).toBe(1);
    component.busqueda = 'sushi';
    expect(component.productosFiltrados.length).toBe(0);
  });
});
