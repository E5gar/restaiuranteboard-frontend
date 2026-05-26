import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { SetupInicialComponent } from './setup-inicial';

describe('SetupInicialComponent integration', () => {
  let fixture: ComponentFixture<SetupInicialComponent>;
  let component: SetupInicialComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupInicialComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupInicialComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const initReq = httpMock.expectOne(`${environment.apiUrl}/configuracion`);
    initReq.flush({
      configuracionCompleta: false,
      smtpPasswordConfigured: false,
      emailSmtp: '',
      nombreNegocio: '',
      telefonoNegocio: '',
      terminosCondiciones: '',
      logoBase64: '',
      mediosPago: {
        yapeActivo: false,
        yapeTelefono: '',
        plinActivo: false,
        plinTelefono: '',
        transferenciaActiva: false,
        transferencias: [],
      },
    });
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('enviarCodigo uses ConfigService and handles success', async () => {
    component.config.emailSmtp = 'negocio@gmail.com';
    component.config.passwordSmtp = 'abcdefghijklmnop';
    component.enviarCodigo();

    const req = httpMock.expectOne(`${environment.apiUrl}/configuracion/enviar-verificacion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      emailSmtp: 'negocio@gmail.com',
      passwordSmtp: 'abcdefghijklmnop',
    });
    req.flush({ message: 'Código enviado' });
    await fixture.whenStable();

    expect(component.modal.visible).toBe(true);
    expect(component.modal.titulo).toBe('Código enviado');
    expect(component.cargando).toBe(false);
  });

  it('enviarCodigo shows error when backend fails', async () => {
    component.config.emailSmtp = 'negocio@gmail.com';
    component.config.passwordSmtp = 'abcdefghijklmnop';
    component.enviarCodigo();

    const req = httpMock.expectOne(`${environment.apiUrl}/configuracion/enviar-verificacion`);
    req.flush({ message: 'SMTP rechazado' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(component.modal.esError).toBe(true);
    expect(component.modal.mensaje).toBe('SMTP rechazado');
  });
});
