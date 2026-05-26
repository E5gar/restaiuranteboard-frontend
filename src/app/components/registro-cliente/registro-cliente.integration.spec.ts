import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { RegistroClienteComponent } from './registro-cliente';

describe('RegistroClienteComponent integration', () => {
  let fixture: ComponentFixture<RegistroClienteComponent>;
  let component: RegistroClienteComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroClienteComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroClienteComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('enviarCodigo posts registration payload and advances step', async () => {
    component.usuario.fullName = 'Juan Pérez';
    component.usuario.dni = '12345678';
    component.usuario.phone = '912345678';
    component.usuario.email = 'juan@gmail.com';
    component.usuario.address = 'Av. Lima 123';
    component.usuario.password = 'Abcdef1@';
    component.confirmarPassword = 'Abcdef1@';
    component.aceptoTerminos = true;
    component.enviarCodigo();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-registro`);
    expect(req.request.body).toEqual({
      fullName: 'Juan Pérez',
      dni: '12345678',
      email: 'juan@gmail.com',
      phone: '912345678',
    });
    req.flush({});
    await fixture.whenStable();

    expect(component.paso).toBe(2);
    expect(component.modal.visible).toBe(true);
  });

  it('registrarFinal posts client registration with verification code', async () => {
    component.usuario.fullName = 'Juan Pérez';
    component.usuario.dni = '12345678';
    component.usuario.phone = '912345678';
    component.usuario.email = 'juan@gmail.com';
    component.usuario.address = 'Av. Lima 123';
    component.usuario.password = 'Abcdef1@';
    component.codigoVerificacion = '123456';
    component.registrarFinal();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/registrar-cliente`);
    expect(req.request.body.codigo).toBe('123456');
    req.flush({});
    await fixture.whenStable();

    expect(component.modal.titulo).toBe('¡Bienvenido!');
  });
});
