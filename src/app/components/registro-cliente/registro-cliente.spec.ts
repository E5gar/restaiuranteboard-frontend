import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegistroClienteComponent } from './registro-cliente';

describe('RegistroClienteComponent', () => {
  let component: RegistroClienteComponent;
  let fixture: ComponentFixture<RegistroClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroClienteComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroClienteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('validarFormulario', () => {
    it('returns message when full name is blank', () => {
      component.usuario.fullName = '   ';

      const result = component.validarFormulario();

      expect(result).toBe('Los nombres y apellidos no pueden quedar en blanco.');
    });

    it('returns message when full name has only one word', () => {
      component.usuario.fullName = 'Juan';

      const result = component.validarFormulario();

      expect(result).toBe('Ingresa nombres y apellidos (al menos dos palabras).');
    });

    it('returns message when terms are not accepted', () => {
      component.usuario.fullName = 'Juan Pérez';
      component.usuario.address = 'Av. Lima 123';
      component.usuario.dni = '12345678';
      component.usuario.phone = '912345678';
      component.usuario.email = 'juan@gmail.com';
      component.usuario.password = 'Abcdef1@';
      component.confirmarPassword = 'Abcdef1@';
      component.aceptoTerminos = false;

      const result = component.validarFormulario();

      expect(result).toBe('Debes aceptar los términos y condiciones de uso.');
    });

    it('returns null when form is valid', () => {
      component.usuario.fullName = 'Juan Pérez';
      component.usuario.address = 'Av. Lima 123';
      component.usuario.dni = '12345678';
      component.usuario.phone = '912345678';
      component.usuario.email = 'juan@gmail.com';
      component.usuario.password = 'Abcdef1@';
      component.confirmarPassword = 'Abcdef1@';
      component.aceptoTerminos = true;

      const result = component.validarFormulario();

      expect(result).toBeNull();
    });
  });

  describe('enviarCodigo', () => {
    it('opens validation modal when form is invalid', () => {
      component.usuario.fullName = '';

      component.enviarCodigo();

      expect(component.modal.visible).toBe(true);
      expect(component.modal.titulo).toBe('Validación');
    });
  });
});
