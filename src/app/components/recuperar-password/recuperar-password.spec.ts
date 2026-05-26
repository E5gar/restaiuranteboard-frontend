import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { RecuperarPasswordComponent } from './recuperar-password';

describe('RecuperarPasswordComponent', () => {
  let component: RecuperarPasswordComponent;
  let fixture: ComponentFixture<RecuperarPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'email' ? null : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarPasswordComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('enviarCodigo', () => {
    it('opens modal when email domain is not allowed', () => {
      component.email = 'user@proton.me';

      component.enviarCodigo();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Error');
      expect(component.modal.mensaje).toContain('Solo se permiten dominios');
    });
  });

  describe('resetearPassword', () => {
    it('opens modal when code is not 6 digits', () => {
      component.codigo = '12345';
      component.nuevaPassword = 'Abcdef1@';
      component.confirmarPassword = 'Abcdef1@';

      component.resetearPassword();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.mensaje).toBe(
        'El código debe tener exactamente 6 dígitos numéricos.',
      );
    });

    it('opens modal when password validation fails', () => {
      component.codigo = '123456';
      component.nuevaPassword = 'weak';
      component.confirmarPassword = 'weak';

      component.resetearPassword();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Contraseña Débil');
    });
  });
});
