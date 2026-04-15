import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmar-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './confirmar-cuenta.component.html'
})
export class ConfirmarCuentaComponent implements OnInit {
  paso = 1;
  email = ''; // Recibido por URL
  cargando = false;
  verPass = false;
  verConfirmarPass = false;
  aceptoTerminos = false;

  codigoVerificacion = '';
  nuevaPassword = '';
  confirmarPassword = '';

  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '', esExpirado: false };

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/login']); // Si no hay email, regresa al login
      }
    });
  }

  soloNumeros(event: any, max: number) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    return val.substring(0, max);
  }

  validarPassword(): { valido: boolean; error?: string } {
    const p = this.nuevaPassword;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!¡¿?#$%/&])[A-Za-z\d@!¡¿?#$%/&]{8,}$/;
    if (!regex.test(p)) return { valido: false, error: 'La clave requiere: 8+ caracteres, Mayúscula, Minúscula, Número y Símbolo especial.' };
    if (p !== this.confirmarPassword) return { valido: false, error: 'Las contraseñas no coinciden.' };
    return { valido: true };
  }

  enviarCodigo() {
    this.cargando = true;
    this.http.post('http://localhost:8080/api/auth/enviar-codigo-empleado', { email: this.email }).subscribe({
      next: () => {
        this.cargando = false;
        this.paso = 2;
        this.abrirModal('exito', 'Código Enviado', `Se envió un código a ${this.email} para verificar tu identidad.`);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('error', 'Error', err.error?.message || 'Error al enviar código');
      }
    });
  }

  confirmarYCrearClave() {
    if (this.codigoVerificacion.length !== 6) {
      this.abrirModal('error', 'Código Inválido', 'El código debe tener 6 dígitos.');
      return;
    }

    const val = this.validarPassword();
    if (!val.valido) {
      this.abrirModal('error', 'Contraseña Débil', val.error!);
      return;
    }

    this.cargando = true;
    const payload = { email: this.email, codigo: this.codigoVerificacion, password: this.nuevaPassword };

    this.http.post('http://localhost:8080/api/auth/confirmar-empleado', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal('exito', '¡Cuenta Activada!', 'Tu contraseña ha sido configurada correctamente.');
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('error', 'Error', err.error?.message || 'Código incorrecto o expirado.');
      }
    });
  }

  mostrarTerminos() {
    this.abrirModal('terminos', 'Términos y Condiciones', 'Como empleado, te comprometes a usar el sistema solo para fines laborales...');
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    const esExpirado = mensaje.toLowerCase().includes('expirado');
    this.modal = { visible: true, tipo, titulo, mensaje, esExpirado };
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.modal.esExpirado) this.enviarCodigo();
  }
  
  aceptarTerminos() { this.aceptoTerminos = true; this.modal.visible = false; }
  rechazarTerminos() { this.aceptoTerminos = false; this.modal.visible = false; }
}