import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { RegistroAdminComponent } from './registro-admin';

describe('RegistroAdminComponent integration', () => {
  let fixture: ComponentFixture<RegistroAdminComponent>;
  let component: RegistroAdminComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroAdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('enviarCodigo posts to auth enviar-codigo-registro', async () => {
    component.usuario.fullName = 'Ana Admin';
    component.usuario.dni = '87654321';
    component.usuario.phone = '987654321';
    component.usuario.email = 'ana@gmail.com';
    component.usuario.address = 'Calle 1';
    component.usuario.password = 'Segura1@xyz';
    component.confirmarPassword = 'Segura1@xyz';
    component.aceptoTerminos = true;
    component.enviarCodigoRegistro();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-registro`);
    req.flush({});
    await fixture.whenStable();
    expect(component.paso).toBe(2);
  });

  it('registrarFinal posts to auth registrar-admin', async () => {
    component.usuario.fullName = 'Ana Admin';
    component.usuario.dni = '87654321';
    component.usuario.phone = '987654321';
    component.usuario.email = 'ana@gmail.com';
    component.usuario.address = 'Calle 1';
    component.usuario.password = 'Segura1@xyz';
    component.codigoVerificacion = '654321';
    component.confirmarRegistro();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/registrar-admin`);
    expect(req.request.body.email).toBe('ana@gmail.com');
    req.flush({});
    await fixture.whenStable();
    expect(component.modal.visible).toBe(true);
  });
});
