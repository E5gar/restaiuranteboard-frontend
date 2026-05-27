import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { CrearPersonalComponent } from './crear-personal';

describe('CrearPersonalComponent integration', () => {
  let fixture: ComponentFixture<CrearPersonalComponent>;
  let component: CrearPersonalComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPersonalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPersonalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/admin/personal/activos`);
    req.flush([]);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('crearCuenta posts employee payload to backend', async () => {
    component.seleccionarRol('CAJERO');
    component.empleado.nombres = 'Luis';
    component.empleado.apellidos = 'García';
    component.empleado.dni = '12345678';
    component.empleado.email = 'luis@gmail.com';
    component.empleado.phone = '912345678';
    component.empleado.address = 'Av. 1';
    component.crearCuenta();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/crear-empleado`);
    expect(req.request.body.role).toBe('CAJERO');
    expect(req.request.body.fullName).toBe('Luis García');
    req.flush({ message: 'Cuenta creada' });
    await fixture.whenStable();
    expect(component.modal.visible).toBe(true);
    expect(component.modal.titulo).toBe('Personal Creado');
  });
});
