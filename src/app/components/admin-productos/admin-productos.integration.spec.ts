import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { AdminProductosComponent } from './admin-productos';

describe('AdminProductosComponent integration', () => {
  let fixture: ComponentFixture<AdminProductosComponent>;
  let component: AdminProductosComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const ingReq = httpMock.expectOne(`${environment.apiUrl}/catalogo/ingredientes`);
    ingReq.flush([{ id: 1, name: 'Tomate', category: 'verduras' }]);

    const prodReq = httpMock.expectOne(`${environment.apiUrl}/catalogo/productos`);
    prodReq.flush([{ id: 'p1', name: 'Pizza', price: 25 }]);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('cargarDatos loads ingredients and products from catalog API', async () => {
    await fixture.whenStable();
    expect(component.ingredientes.length).toBe(1);
    expect(component.productos.length).toBe(1);
    expect(component.ingredientes[0].name).toBe('Tomate');
  });
});
