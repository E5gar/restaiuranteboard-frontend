import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CrearPersonalComponent } from './crear-personal';
import { environment } from '@env/environment';

describe('CrearPersonalComponent', () => {
  let component: CrearPersonalComponent;
  let fixture: ComponentFixture<CrearPersonalComponent>;
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('crearCuenta', () => {
    it('opens modal when role is not selected', () => {
      component.empleado.role = '';

      component.crearCuenta();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Falta Rol');
    });

    it('opens modal when dni is invalid', () => {
      component.empleado.role = 'CAJERO';
      component.empleado.nombres = 'Luis';
      component.empleado.apellidos = 'García';
      component.empleado.dni = '123';
      component.empleado.email = 'luis@gmail.com';
      component.empleado.phone = '912345678';
      component.empleado.address = 'Av. 1';

      component.crearCuenta();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('DNI Inválido');
    });
  });
});
