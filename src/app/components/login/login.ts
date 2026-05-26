import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import {
  bloquearTeclasNoNumericas,
  errorCodigo6,
  errorEmailHistoriaUsuario,
  filtrarSoloDigitos,
} from '../../utils/form-validators';
import { AuthService } from '../../services/auth.service';
import { CartService, type VerificarPreciosResponseDto } from '../../services/cart.service';
import { ConfigService } from '../../services/config.service';
import { MfaService } from '../../services/mfa.service';
import { GoogleAuthApiService } from '../../services/google-auth-api.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  paso: 'credenciales' | 'mfa' = 'credenciales';
  email = '';
  password = '';
  mostrarPassword = false;
  cargando = false;

  mfaToken = '';
  mfaEmail = '';
  mfaCode = '';
  mfaBackupCode = '';
  usarCodigoRespaldo = false;

  logoSrc = '/iconos/candado.png';
  logoEsDelNegocio = false;
  googleDisponible = false;
  googleCargando = false;

  tituloMarca = 'Restaiuranteboard';

  modal = { visible: false, titulo: '', mensaje: '', esError: false };
  redirectAlCerrarModal = false;

  modalDisponibilidad = { visible: false, items: [] as string[] };

  modalPreciosLogin: {
    detalle: { nombre: string; precioAnterior: number; precioNuevo: number }[];
    totalAnterior: number;
    totalNuevo: number;
  } | null = null;

  private pendingVerifyTrasDisponibilidadLogin: VerificarPreciosResponseDto | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private cart: CartService,
    private configService: ConfigService,
    private theme: ThemeService,
    private mfaService: MfaService,
    private googleAuth: GoogleAuthService,
    private googleAuthApi: GoogleAuthApiService,
  ) {
    this.googleDisponible = this.googleAuth.enabled;
  }

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
      this.abrirModal('Campos Vacíos', 'Por favor ingresa tus credenciales.', false);
      return;
    }

    const emailErr = errorEmailHistoriaUsuario(this.email);
    if (emailErr) {
      this.abrirModal('Correo Inválido', emailErr, true);
      return;
    }

    this.cargando = true;
    this.http
      .post(environment.apiUrl + '/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (user: any) => {
          this.cargando = false;
          this.manejarRespuestaAuth(user);
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

  soloNumerosMfa(event: Event) {
    this.mfaCode = filtrarSoloDigitos(event, 6);
  }

  bloquearNoNumericoMfa(event: KeyboardEvent) {
    bloquearTeclasNoNumericas(event);
  }

  volverCredenciales() {
    this.paso = 'credenciales';
    this.mfaToken = '';
    this.mfaCode = '';
    this.mfaBackupCode = '';
    this.usarCodigoRespaldo = false;
  }

  onLoginGoogle() {
    if (!this.googleAuth.enabled) {
      this.abrirModal('Google no disponible', 'El inicio de sesión con Google no está configurado.', true);
      return;
    }
    this.googleCargando = true;
    this.googleAuth
      .requestAuth()
      .then((auth) => {
        this.googleAuthApi.login(auth).subscribe({
          next: (user) => {
            this.googleCargando = false;
            this.manejarRespuestaAuth(user);
          },
          error: (err) => {
            this.googleCargando = false;
            this.abrirModal(
              'Acceso con Google',
              err.error?.message || 'No se pudo iniciar sesión con Google.',
              true,
            );
          },
        });
      })
      .catch(() => {
        this.googleCargando = false;
        this.abrirModal('Acceso con Google', 'Autenticación cancelada o no disponible.', true);
      });
  }

  private manejarRespuestaAuth(user: Record<string, unknown>) {
    if (user?.['mfaRequired'] === true && user?.['mfaToken']) {
      this.paso = 'mfa';
      this.mfaToken = String(user['mfaToken']);
      this.mfaEmail = String(user['email'] || this.email);
      this.mfaCode = '';
      this.mfaBackupCode = '';
      this.usarCodigoRespaldo = false;
      return;
    }
    this.procesarLoginExitoso(user);
  }

  onVerificarMfa() {
    if (!this.mfaToken) {
      this.abrirModal('Sesión expirada', 'Vuelve a iniciar sesión con tu correo y contraseña.', true);
      this.volverCredenciales();
      return;
    }
    if (!this.usarCodigoRespaldo) {
      const codErr = errorCodigo6(this.mfaCode);
      if (codErr) {
        this.abrirModal('Código inválido', codErr, true);
        return;
      }
    } else if (!this.mfaBackupCode.trim()) {
      this.abrirModal('Código de respaldo', 'Ingresa uno de tus códigos de recuperación.', true);
      return;
    }

    this.cargando = true;
    const payload = this.usarCodigoRespaldo
      ? { mfaToken: this.mfaToken, backupCode: this.mfaBackupCode.trim() }
      : { mfaToken: this.mfaToken, code: this.mfaCode };

    this.mfaService.verificarLogin(payload).subscribe({
      next: (user) => {
        this.cargando = false;
        this.procesarLoginExitoso(user);
      },
      error: (err) => {
        this.cargando = false;
        const status = err.status;
        const mensaje = err.error?.message || 'El código ingresado no es válido o ha expirado.';
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
            `Código incorrecto. Intento ${intentos}/3. Te quedan ${restantes} intento(s).`,
            true,
          );
          return;
        }

        this.abrirModal('Verificación fallida', mensaje, true);
      },
    });
  }

  private procesarLoginExitoso(user: any) {
    const guest = sessionStorage.getItem('rb_guest_dark');
    let dark = user.darkMode === true;
    if (guest === '1') dark = true;
    else if (guest === '0') dark = false;
    sessionStorage.removeItem('rb_guest_dark');
    this.auth.setSession({ ...user, darkMode: dark });
    this.theme.persistLoginTheme(dark, String(user.email || ''));

    if (user.firstLogin) {
      this.cart.applyFromLoginPayload(user);
      void this.router.navigate(['/confirmar-cuenta'], { queryParams: { email: user.email } });
      return;
    }

    const snap = this.cart.readPersistedSnapshot();
    if (user.userId && snap && snap.userId !== user.userId) {
      this.cart.clearPriceSnapshot();
    }

    const continuarTrasCarrito = (verifyResp: VerificarPreciosResponseDto | null) => {
      const removed: string[] = Array.isArray(user.removedItems) ? user.removedItems : [];
      if (removed.length > 0) {
        this.modalDisponibilidad = { visible: true, items: removed };
        if (verifyResp?.preciosCambiaron) {
          this.pendingVerifyTrasDisponibilidadLogin = verifyResp;
        }
        return;
      }
      if (verifyResp?.preciosCambiaron) {
        this.modalPreciosLogin = {
          detalle: verifyResp.detalleCambios ?? [],
          totalAnterior: verifyResp.totalAnterior,
          totalNuevo: verifyResp.totalNuevo,
        };
        return;
      }
      this.irTrasLoginClientePreferente();
    };

    const snapOk = user.userId && snap && snap.userId === user.userId && snap.lines.length > 0;

    if (snapOk) {
      this.cart
        .verificarPreciosCheckout({
          lineasCliente: snap.lines.map((l: { productId: string; unitPrice: number; quantity: number }) => ({
            productId: l.productId,
            precioUnitario: l.unitPrice,
            cantidad: l.quantity,
          })),
          totalCliente: snap.lines.reduce((s: number, l: { unitPrice: number; quantity: number }) => s + l.unitPrice * l.quantity, 0),
        })
        .subscribe({
          next: (r) => {
            this.cart.applyFromLoginPayload(user);
            continuarTrasCarrito(r);
          },
          error: () => {
            this.cart.applyFromLoginPayload(user);
            continuarTrasCarrito(null);
          },
        });
      return;
    }

    this.cart.applyFromLoginPayload(user);
    continuarTrasCarrito(null);
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

  cerrarModalDisponibilidad() {
    this.modalDisponibilidad.visible = false;
    const pending = this.pendingVerifyTrasDisponibilidadLogin;
    this.pendingVerifyTrasDisponibilidadLogin = null;
    if (pending?.preciosCambiaron) {
      this.modalPreciosLogin = {
        detalle: pending.detalleCambios ?? [],
        totalAnterior: pending.totalAnterior,
        totalNuevo: pending.totalNuevo,
      };
      return;
    }
    this.irTrasLoginClientePreferente();
  }

  cerrarModalPreciosLogin(): void {
    this.modalPreciosLogin = null;
    this.irTrasLoginClientePreferente();
  }

  formatoMoneda(v: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
  }

  nombresCambioPrecioLogin(): string {
    const m = this.modalPreciosLogin;
    if (!m?.detalle?.length) {
      return '';
    }
    return m.detalle.map((d) => d.nombre).join(', ');
  }

  private irTrasLoginClientePreferente(): void {
    const s = this.auth.getSession();
    if (!s?.role) {
      return;
    }
    const ret = this.route.snapshot.queryParamMap.get('returnUrl')?.trim();
    if (ret && ret.startsWith('/') && !ret.startsWith('//')) {
      void this.router.navigateByUrl(ret);
      return;
    }
    this.navegarTrasLogin(s.role);
  }

  private navegarTrasLogin(role: string) {
    switch (role) {
      case 'ADMIN':
        void this.router.navigate(['/gestion-administrador']);
        break;
      case 'CLIENTE':
        void this.router.navigate(['/menu']);
        break;
      case 'CAJERO':
        void this.router.navigate(['/caja']);
        break;
      case 'COCINERO':
        void this.router.navigate(['/cocina']);
        break;
      case 'REPARTIDOR':
        void this.router.navigate(['/entregas']);
        break;
      default:
        break;
    }
  }
}
