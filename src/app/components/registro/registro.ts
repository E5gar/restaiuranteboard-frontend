import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { GoogleAuthApiService } from '../../services/google-auth-api.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from '@env/environment'; 
import {
  bloquearTeclasNoNumericas,
  errorCodigo6,
  errorDni8,
  errorEmailHistoriaUsuario,
  errorPasswordHistoria,
  errorTelefono9,
  filtrarSoloDigitos,
  filtrarSoloLetrasYEspacios,
} from '../../utils/form-validators';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
})
export class RegistroComponent implements OnInit {
  isAdminMode: boolean | null = null;
  paso = 1;
  mostrarPassword = false;
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

  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '', esExpirado: false };
  logoSrc = '/iconos/candado.png';
  logoEsDelNegocio = false;
  tituloMarca = 'Restaiuranteboard';

  modoGoogle = false;
  googleDisponible = false;
  googleCargando = false;
  private googleRegistrationToken = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private config: ConfigService,
    private googleAuth: GoogleAuthService,
    private googleAuthApi: GoogleAuthApiService,
    private auth: AuthService,
    private theme: ThemeService,
  ) {
    this.googleDisponible = this.googleAuth.enabled;
  }

  ngOnInit() {
    this.config
      .obtenerConfiguracion()
      .pipe(catchError(() => of(null)))
      .subscribe((cfg) => {
        const nombre = cfg?.nombreNegocio?.trim();
        if (nombre) this.tituloMarca = nombre;
        const logo = cfg?.logoBase64?.trim();
        if (logo) {
          this.logoSrc = logo;
          this.logoEsDelNegocio = true;
        }
      });

    this.http.get(environment.apiUrl + '/auth/check-admin').subscribe({
      next: (res: any) => (this.isAdminMode = !res.hasAdmin),
      error: () =>
        this.abrirModal('error', 'Error de Conexión', 'No se pudo contactar al servidor.'),
    });
  }

  soloNumeros(event: Event, max: number) {
    return filtrarSoloDigitos(event, max);
  }

  soloLetras(event: Event, max?: number) {
    return filtrarSoloLetrasYEspacios(event, max);
  }

  bloquearNoNumerico(event: KeyboardEvent) {
    bloquearTeclasNoNumericas(event);
  }

  validarFormulario(): { valido: boolean; error?: string } {
    if (
      !this.usuario.nombres.trim() ||
      !this.usuario.apellidos.trim() ||
      !this.usuario.address.trim()
    ) {
      return { valido: false, error: 'Nombres, apellidos y dirección no pueden quedar en blanco.' };
    }

    const dniErr = errorDni8(this.usuario.dni);
    if (dniErr) return { valido: false, error: dniErr };

    const telErr = errorTelefono9(this.usuario.phone);
    if (telErr) return { valido: false, error: telErr };

    const emailErr = errorEmailHistoriaUsuario(this.usuario.email);
    if (emailErr) return { valido: false, error: emailErr };

    if (!this.modoGoogle) {
      const nombreFirst = this.usuario.nombres.split(' ')[0]?.toLowerCase() ?? '';
      const apellidoFirst = this.usuario.apellidos.split(' ')[0]?.toLowerCase() ?? '';
      const pwdErr = errorPasswordHistoria(
        this.usuario.password,
        this.confirmarPassword,
        nombreFirst,
        apellidoFirst,
      );
      if (pwdErr) return { valido: false, error: pwdErr };
    }

    return { valido: true };
  }

  iniciarRegistroGoogle() {
    if (!this.googleAuth.enabled) {
      this.abrirModal('error', 'Google no disponible', 'El registro con Google no está configurado.');
      return;
    }
    this.googleCargando = true;
    const timeoutId = setTimeout(() => {
      if (this.googleCargando) {
        this.googleCargando = false;
      }
    }, 20000);
    this.googleAuth
      .requestAuth()
      .then((auth) => {
        clearTimeout(timeoutId);
        this.googleAuthApi.sesionRegistro(auth).subscribe({
          next: (sesion) => {
            this.googleCargando = false;
            this.modoGoogle = true;
            this.googleRegistrationToken = sesion.registrationToken;
            this.usuario.nombres = sesion.givenName || '';
            this.usuario.apellidos = sesion.familyName || '';
            this.usuario.email = sesion.email || '';
            this.paso = 1;
          },
          error: (err) => {
            this.googleCargando = false;
            this.abrirModal(
              'error',
              'Registro con Google',
              err.error?.message || 'No se pudo verificar la cuenta de Google.',
            );
          },
        });
      })
      .catch(() => {
        clearTimeout(timeoutId);
        this.googleCargando = false;
        this.abrirModal('error', 'Registro con Google', 'Autenticación cancelada o no disponible.');
      });
  }

  cancelarModoGoogle() {
    this.modoGoogle = false;
    this.googleRegistrationToken = '';
  }

  abrirTerminos(event: Event) {
    event.preventDefault();
    this.config.obtenerConfiguracion().subscribe({
      next: (cfg) => {
        const t = cfg.terminosCondiciones?.trim();
        this.abrirModal(
          'terminos',
          'Términos y Condiciones de Uso',
          t || 'No hay términos configurados.',
        );
      },
      error: () =>
        this.abrirModal(
          'terminos',
          'Términos y Condiciones de Uso',
          'No se pudieron cargar los términos.',
        ),
    });
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

    if (!this.aceptoTerminos) {
      this.abrirModal('error', 'Términos', 'Debes aceptar los términos y condiciones.');
      return;
    }

    if (this.modoGoogle) {
      this.registrarConGoogle();
      return;
    }

    this.cargando = true;
    this.http
      .post(environment.apiUrl + '/auth/enviar-codigo-registro', {
        fullName: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim(),
        dni: this.usuario.dni,
        email: this.usuario.email,
        phone: this.usuario.phone,
      })
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
          const msg = err.error?.message || 'Error al enviar código';
          this.abrirModal(
            'error',
            String(msg).includes('Ya existe') ? 'Datos duplicados' : 'Error',
            msg,
          );
        },
      });
  }

  registrarConGoogle() {
    if (!this.googleRegistrationToken) {
      this.abrirModal('error', 'Sesión Google', 'Vuelve a autorizar con Google.');
      return;
    }
    this.cargando = true;
    const payload = {
      registrationToken: this.googleRegistrationToken,
      fullName: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim(),
      dni: this.usuario.dni,
      phone: this.usuario.phone,
      address: this.usuario.address,
    };
    this.googleAuthApi.registrar(payload).subscribe({
      next: (user) => {
        this.cargando = false;
        const guest = sessionStorage.getItem('rb_guest_dark');
        let dark = user['darkMode'] === true;
        if (guest === '1') dark = true;
        else if (guest === '0') dark = false;
        sessionStorage.removeItem('rb_guest_dark');
        this.auth.setSession({ ...user, darkMode: dark });
        this.theme.persistLoginTheme(dark, String(user['email'] || ''));
        const msg = 'Tu cuenta ha sido creada con Google.';
        this.abrirModal('exito', '¡Bienvenido!', msg);
        setTimeout(() => {
          const role = String(user['role'] || '');
          if (role === 'ADMIN') {
            void this.router.navigate(['/gestion-administrador']);
          } else {
            void this.router.navigate(['/menu']);
          }
        }, 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal(
          'error',
          'Registro con Google',
          err.error?.message || 'No se pudo completar el registro.',
        );
      },
    });
  }

  registrarFinal() {
    const codErr = errorCodigo6(this.codigoVerificacion);
    if (codErr) {
      this.abrirModal('error', 'Código Inválido', codErr);
      return;
    }

    this.cargando = true;

    const payload = {
      fullName: `${this.usuario.nombres} ${this.usuario.apellidos}`.trim(),
      dni: this.usuario.dni,
      email: this.usuario.email,
      phone: this.usuario.phone,
      password: this.usuario.password,
      address: this.usuario.address,
      codigo: this.codigoVerificacion,
    };

    this.http
      .post(environment.apiUrl + '/auth/registrar', payload)
      .subscribe({
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
