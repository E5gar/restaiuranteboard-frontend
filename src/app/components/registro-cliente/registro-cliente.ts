import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro-cliente.component.html', // <-- OJO CON ESTA LÍNEA
})
export class RegistroClienteComponent {
  paso = 1;
  verPass = false;
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

  validarPassword(): { valido: boolean; error?: string } {
    const p = this.usuario.password;
    const nombre = this.usuario.fullName.toLowerCase();
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!¡¿?#$%/&])[A-Za-z\d@!¡¿?#$%/&]{8,}$/;

    if (!regex.test(p))
      return {
        valido: false,
        error: 'La clave requiere: 8+ caracteres, Mayúscula, Minúscula, Número y Símbolo.',
      };
    if (nombre && p.toLowerCase().includes(nombre.split(' ')[0]))
      return { valido: false, error: 'La clave no puede contener tu nombre.' };
    if (p !== this.confirmarPassword)
      return { valido: false, error: 'Las contraseñas no coinciden.' };
    return { valido: true };
  }

  enviarCodigo() {
    const validacion = this.validarPassword();
    if (!validacion.valido) {
      this.abrirModal('Validación', validacion.error!, true);
      return;
    }

    this.cargando = true;
    this.http
      .post('http://localhost:8080/api/auth/enviar-codigo-registro', { email: this.usuario.email })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal(
            'Verifica tu correo',
            'Hemos enviado un código a ' + this.usuario.email,
            false,
          );
          this.paso = 2;
        },
        error: (err) => {
          this.cargando = false;
          this.abrirModal('Error', err.error?.message || 'No pudimos enviar el código.', true);
        },
      });
  }

  registrarFinal() {
    this.cargando = true;
    const payload = { ...this.usuario, codigo: this.codigoVerificacion };

    this.http.post('http://localhost:8080/api/auth/registrar-cliente', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal(
          '¡Bienvenido!',
          'Tu cuenta ha sido creada. Ya puedes pedir tu comida favorita.',
          false,
        );
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal(
          'Error de Validación',
          err.error?.message || 'Código inválido o expirado.',
          true,
        );
      },
    });
  }

  abrirModal(titulo: string, mensaje: string, esError: boolean) {
    const esExpirado = mensaje.toLowerCase().includes('expirado');
    this.modal = { visible: true, titulo, mensaje, esError, esExpirado };
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.modal.esExpirado) this.enviarCodigo();
  }
}
