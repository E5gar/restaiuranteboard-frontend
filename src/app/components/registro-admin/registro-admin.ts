import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-admin.component.html',
})
export class RegistroAdminComponent {
  paso = 1;
  verPass = false;
  verConfirmarPass = false;
  aceptoTerminos = false;
  cargando = false;
  confirmarPassword = '';
  codigoVerificacion = '';

  usuario = {
    fullName: '',
    dni: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  };

  modal = { visible: false, titulo: '', mensaje: '', esError: false, esExpirado: false };

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  soloNumeros(event: any, max: number) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    return val.substring(0, max);
  }

  validarPasswordNivelPro(): { valido: boolean; error?: string } {
    const p = this.usuario.password;
    const nombre = this.usuario.fullName.toLowerCase();
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!¡¿?#$%/&])[A-Za-z\d@!¡¿?#$%/&]{8,}$/;

    if (!regex.test(p))
      return {
        valido: false,
        error:
          'La clave debe tener 8+ caracteres, Mayúscula, Minúscula, Número y Carácter especial.',
      };
    if (nombre && p.toLowerCase().includes(nombre.split(' ')[0]))
      return { valido: false, error: 'La clave no puede contener tu nombre.' };
    if (p !== this.confirmarPassword)
      return { valido: false, error: 'Las contraseñas no coinciden.' };
    return { valido: true };
  }

  enviarCodigoRegistro() {
    const validacion = this.validarPasswordNivelPro();
    if (!validacion.valido) {
      this.abrirModal('Validación de Clave', validacion.error!, true);
      return;
    }

    this.cargando = true;
    this.http
      .post('http://localhost:8080/api/auth/enviar-codigo-registro', { email: this.usuario.email })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal('Verificación Enviada', 'Código enviado a ' + this.usuario.email, false);
          this.paso = 2;
        },
        error: (err) => {
          this.cargando = false;
          this.abrirModal('Error', err.error?.message || 'Error al enviar código', true);
        },
      });
  }

  confirmarRegistro() {
    this.cargando = true;
    const payload = { ...this.usuario, codigo: this.codigoVerificacion };

    this.http.post('http://localhost:8080/api/auth/registrar-admin', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal(
          '¡Éxito!',
          'Cuenta de Administrador creada. Ahora puedes iniciar sesión.',
          false,
        );
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'Código incorrecto';
        this.abrirModal('Error de Validación', msg, true);
      },
    });
  }

  abrirModal(titulo: string, mensaje: string, esError: boolean) {
    const esExpirado = mensaje.toLowerCase().includes('expirado');
    this.modal = { visible: true, titulo, mensaje, esError, esExpirado };
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.modal.esExpirado) this.enviarCodigoRegistro();
  }

  mostrarTerminos() {
    this.abrirModal(
      'Términos y Condiciones',
      'Usted está registrando la cuenta principal del negocio...',
      false,
    );
  }
}
