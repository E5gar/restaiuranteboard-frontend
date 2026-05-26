import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { SoporteService } from '../../services/soporte.service';
import { WebsocketService } from '../../services/websocket.service';
import { AtencionClienteComponent } from './atencion-cliente';

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function testJwt(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const payload = base64UrlEncode({ exp });
  return `${header}.${payload}.sig`;
}

describe('AtencionClienteComponent', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AtencionClienteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
        {
          provide: CartService,
          useValue: {
            items: () => [],
            totalUnidades: () => 0,
            puedeSincronizar: () => false,
            cargarDesdeServidor: () => of({ items: [], removedItems: [] }),
          },
        },
        {
          provide: SoporteService,
          useValue: {
            pedidosRecientes: () => of([]),
            pendientesCount: () => of({ pendientes: 0 }),
          },
        },
      ],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE', userId: 'u1' });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function createFixture(): ComponentFixture<AtencionClienteComponent> {
    const fixture = TestBed.createComponent(AtencionClienteComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('charsRestantes_limitsDescriptionTo500', () => {
    const component = createFixture().componentInstance;
    component.descripcion = 'a'.repeat(400);
    expect(component.charsRestantes()).toBe(100);
  });

  it('siguientePaso_requiresOrderOnStep1', () => {
    const component = createFixture().componentInstance;
    component.paso.set(1);
    component.orderId = '';
    component.siguientePaso();
    expect(component.error()).toBe('Selecciona un pedido.');
  });

  it('redirectsNonClienteToMenu', () => {
    auth.setSession({ token: testJwt(3600), role: 'ADMIN', userId: 'u1' });
    const navigateSpy = vi.spyOn(router, 'navigate');
    TestBed.createComponent(AtencionClienteComponent).detectChanges();
    expect(navigateSpy).toHaveBeenCalledWith(['/menu']);
  });
});
