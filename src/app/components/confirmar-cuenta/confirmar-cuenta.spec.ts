import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { ThemeService } from '../../services/theme.service';
import { ConfirmarCuentaComponent } from './confirmar-cuenta';

describe('ConfirmarCuentaComponent', () => {
  let component: ConfirmarCuentaComponent;
  let fixture: ComponentFixture<ConfirmarCuentaComponent>;
  let themeMock: { onLogout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    themeMock = { onLogout: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmarCuentaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ email: 'empleado@gmail.com' }) },
        },
        {
          provide: ConfigService,
          useValue: { obtenerConfiguracion: () => of({ terminosCondiciones: 'Términos' }) },
        },
        { provide: ThemeService, useValue: themeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarCuentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('confirmarYCrearClave', () => {
    it('opens modal when verification code is not 6 digits', () => {
      component.codigoVerificacion = '12345';

      component.confirmarYCrearClave();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Código Inválido');
      expect(component.modal.mensaje).toBe(
        'El código debe tener exactamente 6 dígitos numéricos.',
      );
    });

    it('opens modal when password is weak', () => {
      component.codigoVerificacion = '123456';
      component.nuevaPassword = 'abc';
      component.confirmarPassword = 'abc';

      component.confirmarYCrearClave();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Contraseña Débil');
    });
  });
});
