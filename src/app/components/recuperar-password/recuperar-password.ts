import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recuperar-password.component.html'
})
export class RecuperarPasswordComponent {
  paso = 1;
  cargando = false;
  email = '';
  codigo = '';
  nuevaPassword = '';
  confirmarPassword = '';
  verPass = false;
  verConfirmarPass = false;

  modal = { visible: false, titulo: '', mensaje: '', esError: false, esExpirado: false };

  constructor(private http: HttpClient, private router: Router) {}

  soloNumeros(event: any, max: number) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    return val.substring(0, max);
  }

  validarPassword(): { valido: boolean; error?: string } {
    const p = this.nuevaPassword;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!¡¿?#$%/&])[A-Za-z\d@!¡¿?#$%/&]{8,}$/;

    if (!regex.test(p)) return { valido: false, error: 'La clave requiere: 8+ caracteres, Mayúscula, Minúscula, Número y Símbolo.' };
    if (p !== this.confirmarPassword) return { valido: false, error: 'Las contraseñas no coinciden.' };
    return { valido: true };
  }

  enviarCodigo() {
    if (!this.email.includes('@')) {
      this.abrirModal('Error', 'Ingresa un correo electrónico válido.', true);
      return;
    }

    this.cargando = true;
    this.http.post('http://localhost:8080/api/auth/enviar-codigo-recuperacion', { email: this.email }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 2;
        this.abrirModal('Código Enviado', 'Revisa tu bandeja de entrada o spam.', false);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('Error', err.error?.message || 'Error al enviar el código.', true);
      }
    });
  }

  resetearPassword() {
    if (this.codigo.length !== 6) {
      this.abrirModal('Error', 'El código debe tener 6 dígitos.', true);
      return;
    }

    const validacion = this.validarPassword();
    if (!validacion.valido) {
      this.abrirModal('Contraseña Débil', validacion.error!, true);
      return;
    }

    this.cargando = true;
    const payload = { email: this.email, codigo: this.codigo, newPassword: this.nuevaPassword };

    this.http.post('http://localhost:8080/api/auth/reset-password', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal('¡Éxito!', 'Tu contraseña ha sido actualizada.', false);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('Error', err.error?.message || 'Código inválido o expirado.', true);
      }
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