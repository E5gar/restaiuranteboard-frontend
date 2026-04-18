import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { errorEmailHistoriaUsuario } from '../../utils/form-validators';
import { AuthService } from '../../services/auth.service';
import { ConfigService } from '../../services/config.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  mostrarPassword = false;
  cargando = false;

  logoSrc = '/iconos/candado.png';
  logoEsDelNegocio = false;

  tituloMarca = 'Restaiuranteboard';

  modal = { visible: false, titulo: '', mensaje: '', esError: false };
  redirectAlCerrarModal = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private configService: ConfigService,
    private theme: ThemeService,
  ) {}

  ngOnInit() {
    this.configService
      .obtenerConfiguracion()
      .pipe(catchError(() => of(null)))
      .subscribe((cfg) => {
        const nombre = cfg?.nombreNegocio?.trim();
        if (nombre) {
          this.tituloMarca = nombre;
        }
        const logo = cfg?.logoBase64?.trim();
        if (logo) {
          this.logoSrc = logo;
          this.logoEsDelNegocio = true;
        }
      });
  }

  onLogin() {
    if (!this.email?.trim() || !this.password) {
      this.abrirModal('Campos Vacíos', 'Por favor ingresa tus credenciales.', true);
      return;
    }

    const emailErr = errorEmailHistoriaUsuario(this.email);
    if (emailErr) {
      this.abrirModal('Correo Inválido', emailErr, true);
      return;
    }

    this.cargando = true;
    this.http
      .post('https://restaiuranteboard-backend.onrender.com/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (user: any) => {
          this.cargando = false;
          const guest = sessionStorage.getItem('rb_guest_dark');
          let dark = user.darkMode === true;
          if (guest === '1') dark = true;
          else if (guest === '0') dark = false;
          sessionStorage.removeItem('rb_guest_dark');
          this.auth.setSession({ ...user, darkMode: dark });
          this.theme.persistLoginTheme(dark, String(user.email || ''));

          if (user.firstLogin) {
            this.router.navigate(['/confirmar-cuenta'], { queryParams: { email: user.email } });
            return;
          }

          switch (user.role) {
            case 'ADMIN':
              this.router.navigate(['/gestion-administrador']);
              break;
            case 'CLIENTE':
              this.router.navigate(['/menu']);
              break;
            case 'CAJERO':
              this.router.navigate(['/caja']);
              break;
            case 'COCINERO':
              this.router.navigate(['/cocina']);
              break;
            case 'REPARTIDOR':
              this.router.navigate(['/entregas']);
              break;
          }
        },

        error: (err) => {
          this.cargando = false;
          const status = err.status;
          const mensaje = err.error?.message || 'Credenciales inválidas';
          const intentos = Number(err.error?.failedAttempts ?? 0);
          const restantes = Number(err.error?.remainingAttempts ?? 0);

          if (status === 423 || err.error?.blocked === true) {
            this.redirectAlCerrarModal = true;
            this.abrirModal(
              'Acceso restringido',
              `${mensaje} Serás redirigido a la vista de retención.`,
              true,
            );
            return;
          }

          if (status === 401 && intentos > 0) {
            this.abrirModal(
              'Intento fallido',
              `Contraseña incorrecta. Intento ${intentos}/3. Te quedan ${restantes} intento(s).`,
              true,
            );
            return;
          }

          this.abrirModal('Acceso Denegado', mensaje, true);
        },
      });
  }

  abrirModal(titulo: string, mensaje: string, esError: boolean) {
    this.modal = { visible: true, titulo, mensaje, esError };
  }

  cerrarModal() {
    this.modal.visible = false;
    if (this.redirectAlCerrarModal) {
      this.redirectAlCerrarModal = false;
      void this.router.navigate(['/retenido']);
    }
  }
}
