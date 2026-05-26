import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { CheckoutComponent } from './checkout';

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

const cartLine = {
  productId: 'p1',
  name: 'Arroz',
  unitPrice: 15,
  quantity: 1,
  thumbSrc: 'assets/no-image.png',
};

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ConfigService,
          useValue: { obtenerConfiguracion: () => of({ mediosPago: {} }) },
        },
        {
          provide: CartService,
          useValue: {
            items: () => [cartLine],
            totalUnidades: () => 1,
            totalOrden: () => 15,
            subtotalLinea: (line: typeof cartLine) => line.unitPrice * line.quantity,
            puedeSincronizar: () => true,
            cargarDesdeServidor: () => of({ removedItems: [] }),
            limpiarLocal: vi.fn(),
            clearPriceSnapshot: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    sessionStorage.clear();
    const auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE', userId: 'u1' });

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('confirmarPedido', () => {
    it('opens modal when payment receipt file is missing', () => {
      component.archivo = null;

      component.confirmarPedido();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Comprobante requerido');
    });
  });

  describe('validarYAsignar', () => {
    it('opens modal when file type is not jpg or png', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });

      component['validarYAsignar'](file);

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Formato no admitido');
      expect(component.archivo).toBeNull();
    });
  });
});
