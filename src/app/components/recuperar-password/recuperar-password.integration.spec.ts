import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { RecuperarPasswordComponent } from './recuperar-password';

describe('RecuperarPasswordComponent integration', () => {
  let fixture: ComponentFixture<RecuperarPasswordComponent>;
  let component: RecuperarPasswordComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarPasswordComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarPasswordComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('enviarCodigo posts recovery email request', async () => {
    component.email = 'usuario@gmail.com';
    component.enviarCodigo();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-recuperacion`);
    expect(req.request.body).toEqual({ email: 'usuario@gmail.com' });
    req.flush({});
    await fixture.whenStable();
    expect(component.paso).toBe(2);
  });

  it('resetearPassword posts new password with code', async () => {
    component.email = 'usuario@gmail.com';
    component.codigo = '123456';
    component.nuevaPassword = 'NuevaPass1@';
    component.confirmarPassword = 'NuevaPass1@';
    component.resetearPassword();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(req.request.body).toEqual({
      email: 'usuario@gmail.com',
      codigo: '123456',
      newPassword: 'NuevaPass1@',
    });
    req.flush({});
    await fixture.whenStable();
    expect(component.modal.visible).toBe(true);
  });
});
