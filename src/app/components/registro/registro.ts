import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
})
export class RegistroComponent implements OnInit {
  isAdminMode: boolean | null = null;
  paso = 1;
  verPass = false;
  verConfirmarPass = false;
  aceptoTerminos = false;
  cargando = false;
  confirmarPassword = '';
  codigoVerificacion = '';

  usuario = {
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  };

  // Tipo de modal: 'error', 'exito', 'info', 'terminos'
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '', esExpirado: false };

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.http.get('http://localhost:8080/api/auth/check-admin').subscribe({
      next: (res: any) => (this.isAdminMode = !res.hasAdmin),
      error: () =>
        this.abrirModal('error', 'Error de Conexión', 'No se pudo contactar al servidor.'),
    });
  }

  // RESTRICCIÓN DE TECLADO: Solo permite números y corta a la longitud máxima
  soloNumeros(event: any, max: number) {
    const input = event.target as HTMLInputElement;
    let valorFiltrado = input.value.replace(/[^0-9]/g, ''); // Elimina letras/símbolos
    if (valorFiltrado.length > max) {
      valorFiltrado = valorFiltrado.substring(0, max);
    }
    input.value = valorFiltrado;
    return valorFiltrado;
  }

  // VALIDACIONES ESTRICTAS (HU-19 y HU-06)
  validarFormulario(): { valido: boolean; error?: string } {
    if (
      !this.usuario.nombres.trim() ||
      !this.usuario.apellidos.trim() ||
      !this.usuario.address.trim()
    ) {
      return { valido: false, error: 'Nombres, apellidos y dirección no pueden quedar en blanco.' };
    }

    if (this.usuario.dni.length !== 8) {
      return { valido: false, error: 'El DNI debe tener exactamente 8 dígitos numéricos.' };
    }

    if (this.usuario.phone.length !== 9 || !this.usuario.phone.startsWith('9')) {
      return {
        valido: false,
        error: 'El teléfono debe empezar con 9 y tener exactamente 9 dígitos numéricos.',
      };
    }

    if (!this.usuario.email.trim())
      return { valido: false, error: 'El correo no puede estar en blanco.' };

    const dominios = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
    if (!this.usuario.email.includes('@'))
      return { valido: false, error: 'El correo debe tener un @.' };
    const dominio = this.usuario.email.split('@')[1];
    if (!dominios.includes(dominio)) {
      return {
        valido: false,
        error: 'Solo dominios permitidos: gmail, outlook, hotmail, yahoo o icloud.',
      };
    }

    const p = this.usuario.password;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!¡¿?#$%/&])[A-Za-z\d@!¡¿?#$%/&]{8,}$/;
    if (!regex.test(p)) {
      return {
        valido: false,
        error:
          'La clave requiere: 8+ caracteres, Mayúscula, Minúscula, Número y Símbolo especial (@!¡¿?#$%/&).',
      };
    }

    // Validar que no contenga el nombre o apellido
    const nombreFirst = this.usuario.nombres.split(' ')[0].toLowerCase();
    const apellidoFirst = this.usuario.apellidos.split(' ')[0].toLowerCase();
    if (nombreFirst && p.toLowerCase().includes(nombreFirst))
      return { valido: false, error: 'La clave no puede contener tu nombre.' };
    if (apellidoFirst && p.toLowerCase().includes(apellidoFirst))
      return { valido: false, error: 'La clave no puede contener tu apellido.' };

    if (p !== this.confirmarPassword)
      return { valido: false, error: 'Las contraseñas no coinciden.' };

    return { valido: true };
  }

  // GESTIÓN DE TÉRMINOS (HU-19 y 06 Crit. 8, 9)
  abrirTerminos(event: Event) {
    event.preventDefault(); // Evita que el checkbox se marque automáticamente
    this.abrirModal(
      'terminos',
      'Términos y Condiciones de Uso',
      'Al utilizar este software, usted se compromete a hacer un uso responsable de los datos. Toda la información registrada está sujeta a políticas de privacidad...',
    );
  }

  aceptarTerminos() {
    this.aceptoTerminos = true;
    this.modal.visible = false;
  }

  rechazarTerminos() {
    this.aceptoTerminos = false;
    this.modal.visible = false;
  }

  enviarCodigo() {
    const validacion = this.validarFormulario();
    if (!validacion.valido) {
      this.abrirModal('error', 'Error de Validación', validacion.error!);
      return;
    }

    this.cargando = true;
    this.http
      .post('http://localhost:8080/api/auth/enviar-codigo-registro', { email: this.usuario.email })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal(
            'exito',
            'Verifica tu correo',
            'Hemos enviado un código a ' + this.usuario.email,
          );
          this.paso = 2;
        },
        error: (err) => {
          this.cargando = false;
          this.abrirModal('error', 'Error', err.error?.message || 'Error al enviar código');
        },
      });
  }

  registrarFinal() {
    if (this.codigoVerificacion.length !== 6) {
      this.abrirModal('error', 'Código Inválido', 'El código debe tener 6 dígitos numéricos.');
      return;
    }

    this.cargando = true;

    // Concatenamos nombres y apellidos para el Backend
    const payload = {
      fullName: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim(),
      dni: this.usuario.dni,
      email: this.usuario.email,
      phone: this.usuario.phone,
      password: this.usuario.password,
      address: this.usuario.address,
      codigo: this.codigoVerificacion,
    };

    this.http.post('http://localhost:8080/api/auth/registrar', payload).subscribe({
      next: () => {
        this.cargando = false;
        const msg = this.isAdminMode
          ? 'Cuenta de Administrador creada.'
          : 'Tu cuenta ha sido creada. ¡A disfrutar!';
        this.abrirModal('exito', '¡Bienvenido!', msg);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal(
          'error',
          'Error de Verificación',
          err.error?.message || 'Código inválido o expirado.',
        );
      },
    });
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    const esExpirado = mensaje.toLowerCase().includes('expirado');
    this.modal = { visible: true, tipo, titulo, mensaje, esExpirado };
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.modal.esExpirado) this.enviarCodigo();
  }
}
