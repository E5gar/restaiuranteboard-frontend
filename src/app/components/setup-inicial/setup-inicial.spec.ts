import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { SetupInicialComponent } from './setup-inicial';

describe('SetupInicialComponent', () => {
  let component: SetupInicialComponent;
  let fixture: ComponentFixture<SetupInicialComponent>;
  let configMock: {
    obtenerConfiguracion: ReturnType<typeof vi.fn>;
    enviarVerificacion: ReturnType<typeof vi.fn>;
    validarYGuardar: ReturnType<typeof vi.fn>;
  };

  const configBase = {
    configuracionCompleta: false,
    emailSmtp: '',
    smtpPasswordConfigured: false,
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
      transferencias: [{ banco: '', numeroCuenta: '', cci: '' }],
    },
  };

  beforeEach(async () => {
    configMock = {
      obtenerConfiguracion: vi.fn(() => of({ ...configBase })),
      enviarVerificacion: vi.fn(() => of({ message: 'Código enviado' })),
      validarYGuardar: vi.fn(() => of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [SetupInicialComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ConfigService, useValue: configMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupInicialComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('enviarCodigo', () => {
    it('shows modal when email is not gmail', () => {
      component.configuracionYaCompleta = false;
      component.config.emailSmtp = 'user@outlook.com';
      component.config.passwordSmtp = 'abcdefghijklmnop';

      component.enviarCodigo();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.mensaje).toBe('Debe ser una cuenta @gmail.com.');
      expect(configMock.enviarVerificacion).not.toHaveBeenCalled();
    });

    it('shows modal when smtp password is shorter than 16 characters', () => {
      component.configuracionYaCompleta = false;
      component.config.emailSmtp = 'user@gmail.com';
      component.config.passwordSmtp = 'short';

      component.enviarCodigo();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.mensaje).toBe(
        'La contraseña de aplicación debe tener al menos 16 caracteres.',
      );
      expect(configMock.enviarVerificacion).not.toHaveBeenCalled();
    });

    it('calls config service when gmail and password are valid', () => {
      component.configuracionYaCompleta = false;
      component.config.emailSmtp = 'user@gmail.com';
      component.config.passwordSmtp = 'abcdefghijklmnop';

      component.enviarCodigo();

      expect(configMock.enviarVerificacion).toHaveBeenCalledWith({
        emailSmtp: 'user@gmail.com',
        passwordSmtp: 'abcdefghijklmnop',
      });
    });
  });
});
