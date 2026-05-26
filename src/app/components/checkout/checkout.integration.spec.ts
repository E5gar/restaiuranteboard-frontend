import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import {
  flushCarritoRequest,
  flushConfiguracionRequests,
  provideIntegrationRouter,
  testJwt,
} from '../../testing/integration-helpers';
import { CheckoutComponent } from './checkout';

describe('CheckoutComponent integration', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let component: CheckoutComponent;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideIntegrationRouter()],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), userId: 'u1', role: 'CLIENTE' });

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.match((r) => r.url === `${environment.apiUrl}/carrito`).forEach((req) => {
      req.flush({
        items: [
          {
            productId: 'p1',
            name: 'Pizza',
            unitPrice: 20,
            quantity: 1,
            thumbSrc: 'x',
          },
        ],
      });
    });
    flushConfiguracionRequests(httpMock);
    flushCarritoRequest(httpMock, 'u1');
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('loads cart and payment config on init', async () => {
    await fixture.whenStable();
    expect(component.cart.items().length).toBe(1);
    expect(component.config?.configuracionCompleta).toBe(true);
  });
});
