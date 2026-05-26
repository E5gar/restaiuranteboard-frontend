import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ChatService } from '../../services/chat.service';
import { UserInteractionsService } from '../../services/user-interactions.service';
import { WebsocketService } from '../../services/websocket.service';
import { MenuClienteComponent } from './menu-cliente';

describe('MenuClienteComponent', () => {
  let component: MenuClienteComponent;
  let fixture: ComponentFixture<MenuClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuClienteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
        { provide: UserInteractionsService, useValue: { track: vi.fn() } },
        {
          provide: ChatService,
          useValue: {
            obtenerSesion: () =>
              of({
                sessionId: 's1',
                closed: false,
                userMessageCount: 0,
                maxUserMessages: 3,
                messages: [],
              }),
          },
        },
        {
          provide: CartService,
          useValue: {
            items: () => [],
            totalUnidades: () => 0,
            totalOrden: () => 0,
            puedeSincronizar: () => false,
            cargarDesdeServidor: () => of({ removedItems: [] }),
            verificarPreciosCheckout: () => of({ preciosCambiaron: false }),
            agregarUno: () => of(void 0),
            incrementar: () => of(void 0),
            decrementar: () => of(void 0),
            quitar: () => of(void 0),
            obtenerSugerenciasCrossSell: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuClienteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatoMoneda formats amount as Peruvian soles', () => {
    const formatted = component.formatoMoneda(25.5);

    expect(formatted).toContain('25');
  });

  it('productosFiltrados filters products by category', () => {
    component.productos.set([
      {
        id: '1',
        name: 'Ceviche',
        price: 30,
        category: 'Entrada',
        description: '',
        imagesBase64: [],
      },
      {
        id: '2',
        name: 'Lomo',
        price: 40,
        category: 'Plato Principal',
        description: '',
        imagesBase64: [],
      },
    ]);
    component.filtroCategoria = 'Entrada';
    component.precioFiltroMin.set(0);
    component.precioFiltroMax.set(100);

    const filtered = component.productosFiltrados;

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Ceviche');
  });

  it('seleccionarCategoria updates filtroCategoria', () => {
    component.seleccionarCategoria('Bebidas');

    expect(component.filtroCategoria).toBe('Bebidas');
  });
});
