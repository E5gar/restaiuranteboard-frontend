import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '@env/environment';
import { ConfirmarCuentaComponent } from './confirmar-cuenta';

describe('ConfirmarCuentaComponent integration', () => {
  let fixture: ComponentFixture<ConfirmarCuentaComponent>;
  let component: ConfirmarCuentaComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmarCuentaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ email: 'cajero@gmail.com' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarCuentaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
  });

  it('enviarCodigo posts employee verification request', async () => {
    component.enviarCodigo();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/enviar-codigo-empleado`);
    expect(req.request.body).toEqual({ email: 'cajero@gmail.com' });
    req.flush({});
    await fixture.whenStable();
    expect(component.paso).toBe(2);
  });

  it('confirmarYCrearClave posts password confirmation', async () => {
    component.codigoVerificacion = '123456';
    component.nuevaPassword = 'Empleado1@';
    component.confirmarPassword = 'Empleado1@';
    component.confirmarYCrearClave();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/confirmar-empleado`);
    expect(req.request.body).toEqual({
      email: 'cajero@gmail.com',
      codigo: '123456',
      password: 'Empleado1@',
    });
    req.flush({});
    await fixture.whenStable();
    expect(component.modal.visible).toBe(true);
  });
});
