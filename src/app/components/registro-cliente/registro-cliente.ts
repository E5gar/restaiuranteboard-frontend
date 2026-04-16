import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import {
  bloquearTeclasNoNumericas,
  errorCodigo6,
  errorDni8,
  errorEmailHistoriaUsuario,
  errorPasswordHistoria,
  errorTelefono9,
  extraerNombreApellidoDeFullName,
  filtrarSoloDigitos,
} from '../../utils/form-validators';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './registro-cliente.component.html',
})
export class RegistroClienteComponent {
  paso = 1;
  mostrarPassword = false;
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

  soloNumeros(event: Event, max: number) {
    return filtrarSoloDigitos(event, max);
  }

  bloquearNoNumerico(event: KeyboardEvent) {
    bloquearTeclasNoNumericas(event);
  }

  validarFormulario(): string | null {
    if (!this.usuario.fullName.trim()) {
      return 'Los nombres y apellidos no pueden quedar en blanco.';
    }
    const partes = this.usuario.fullName.trim().split(/\s+/).filter(Boolean);
    if (partes.length < 2) {
      return 'Ingresa nombres y apellidos (al menos dos palabras).';
    }
    if (!this.usuario.address.trim()) {
      return 'La dirección no puede quedar en blanco.';
    }

    const dniErr = errorDni8(this.usuario.dni);
    if (dniErr) return dniErr;

    const telErr = errorTelefono9(this.usuario.phone);
    if (telErr) return telErr;

    const emailErr = errorEmailHistoriaUsuario(this.usuario.email);
    if (emailErr) return emailErr;

    const { nombre, apellido } = extraerNombreApellidoDeFullName(this.usuario.fullName);
    const pwdErr = errorPasswordHistoria(
      this.usuario.password,
      this.confirmarPassword,
      nombre,
      apellido,
    );
    if (pwdErr) return pwdErr;

    if (!this.aceptoTerminos) {
      return 'Debes aceptar los términos y condiciones de uso.';
    }

    return null;
  }

  enviarCodigo() {
    const err = this.validarFormulario();
    if (err) {
      this.abrirModal('Validación', err, true);
      return;
    }

    this.cargando = true;
    this.http
      .post('https://restaiuranteboard-backend.onrender.com/api/auth/enviar-codigo-registro', {
        email: this.usuario.email,
      })
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
    const codErr = errorCodigo6(this.codigoVerificacion);
    if (codErr) {
      this.abrirModal('Error', codErr, true);
      return;
    }

    this.cargando = true;
    const payload = { ...this.usuario, codigo: this.codigoVerificacion };

    this.http
      .post('https://restaiuranteboard-backend.onrender.com/api/auth/registrar-cliente', payload)
      .subscribe({
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
