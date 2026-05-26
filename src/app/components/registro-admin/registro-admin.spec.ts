import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { RegistroAdminComponent } from './registro-admin';

describe('RegistroAdminComponent', () => {
  let component: RegistroAdminComponent;
  let fixture: ComponentFixture<RegistroAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroAdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ConfigService,
          useValue: {
            obtenerConfiguracion: () =>
              of({ terminosCondiciones: 'Términos de prueba', configuracionCompleta: true }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroAdminComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('validarFormulario', () => {
    it('returns dni error when dni is invalid', () => {
      component.usuario.fullName = 'Ana López';
      component.usuario.address = 'Calle 1';
      component.usuario.dni = '123';
      component.usuario.phone = '912345678';
      component.usuario.email = 'ana@gmail.com';
      component.usuario.password = 'Abcdef1@';
      component.confirmarPassword = 'Abcdef1@';
      component.aceptoTerminos = true;

      const result = component.validarFormulario();

      expect(result).toBe('El DNI debe tener exactamente 8 dígitos numéricos.');
    });
  });

  describe('confirmarRegistro', () => {
    it('opens modal when verification code is not 6 digits', () => {
      component.codigoVerificacion = '12345';

      component.confirmarRegistro();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Error de Validación');
      expect(component.modal.mensaje).toBe(
        'El código debe tener exactamente 6 dígitos numéricos.',
      );
    });
  });

  describe('mostrarTerminos', () => {
    it('opens modal with configured terms', () => {
      component.mostrarTerminos();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.mensaje).toBe('Términos de prueba');
    });
  });
});
