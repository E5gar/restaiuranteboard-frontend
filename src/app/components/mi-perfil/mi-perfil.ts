import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import {
  bloquearTeclasNoNumericas,
  errorCodigo6,
  errorTelefono9,
  filtrarSoloDigitos,
} from '../../utils/form-validators';
import { MfaService } from '../../services/mfa.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { environment } from '@env/environment';

type PerfilResponse = {
  userId: string;
  fullName: string;
  phone: string;
  address: string;
  dni: string;
  email: string;
  role: string;
  canEditAddress: boolean;
  mfaEnabled?: boolean;
  hasLocalPassword?: boolean;
};

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './mi-perfil.component.html',
})
export class MiPerfilComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly mfaService = inject(MfaService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly apiPerfil = environment.apiUrl + '/perfil';

  cargando = signal(true);
  guardando = signal(false);
  enviandoCodigo = signal(false);
  canEditAddress = signal(true);
  roleVisible = signal(false);
  esCliente = signal(false);
  modalEliminar = signal(false);
  eliminando = signal(false);
  passwordEliminar = '';
  hasLocalPassword = signal(true);
  googleDisponible = signal(false);
  googleVerificando = signal(false);
  googleVerificadoEliminar = signal(false);
  googleVerificadoMfa = signal(false);
  private googleLastAuth: { idToken?: string; googleCode?: string } | null = null;

  form = {
    fullName: '',
    phone: '',
    address: '',
    dni: '',
    email: '',
    role: '',
  };

  modal = signal<{ tipo: 'ok' | 'error'; titulo: string; mensaje: string } | null>(null);

  mfaEnabled = signal(false);
  mfaUi = signal<'idle' | 'qr' | 'backup' | 'disable'>('idle');
  mfaCargando = signal(false);
  mfaQrDataUrl = signal('');
  mfaSecretPlain = signal('');
  mfaConfirmCode = signal('');
  mfaBackupCodes = signal<string[]>([]);
  mfaDisablePassword = '';
  mfaDisableCode = '';
  mfaDisableBackupCode = '';
  mfaUsarRespaldoDesactivar = false;

  ngOnInit(): void {
    this.googleDisponible.set(this.googleAuth.enabled);
    this.cargarPerfil();
  }

  volver(): void {
    const path = this.auth.getPostLoginPath();
    const queryParams = this.auth.getPostLoginQueryParams();
    
    this.router.navigate([path], { queryParams });
  }

  soloNumeros(event: Event, max: number): void {
    this.form.phone = filtrarSoloDigitos(event, max);
  }

  bloquearNoNumerico(event: KeyboardEvent): void {
    bloquearTeclasNoNumericas(event);
  }

  guardarCambios(): void {
    const fullName = this.form.fullName.trim();
    const address = this.form.address.trim();
    const phone = (this.form.phone || '').replace(/\D/g, '');
    if (!fullName) {
      this.modal.set({ tipo: 'error', titulo: 'Mi Perfil', mensaje: 'Nombres y apellidos es obligatorio.' });
      return;
    }
    if (!address) {
      this.modal.set({ tipo: 'error', titulo: 'Mi Perfil', mensaje: 'La dirección es obligatoria.' });
      return;
    }
    const phoneErr = errorTelefono9(phone);
    if (phoneErr) {
      this.modal.set({ tipo: 'error', titulo: 'Mi Perfil', mensaje: phoneErr });
      return;
    }
    this.guardando.set(true);
    this.http
      .put<PerfilResponse>(`${this.apiPerfil}/me`, {
        fullName,
        phone,
        address,
      })
      .subscribe({
        next: (resp) => {
          this.guardando.set(false);
          this.aplicarRespuesta(resp);
          this.auth.patchSession({
            fullName: resp.fullName,
            phone: resp.phone,
            address: resp.address,
          });
          this.modal.set({ tipo: 'ok', titulo: 'Mi Perfil', mensaje: 'Tus datos han sido actualizados correctamente' });
        },
        error: (err) => {
          this.guardando.set(false);
          this.modal.set({
            tipo: 'error',
            titulo: 'Mi Perfil',
            mensaje: err?.error?.message || 'No se pudo actualizar tu perfil.',
          });
        },
      });
  }

  cambiarPassword(): void {
    this.enviandoCodigo.set(true);
    this.http.post<{ email: string }>(`${this.apiPerfil}/me/cambiar-password/enviar-codigo`, {}).subscribe({
      next: (resp) => {
        this.enviandoCodigo.set(false);
        void this.router.navigate(['/recuperar'], {
          queryParams: { email: resp?.email || this.form.email, autoSend: '1', locked: '1' },
        });
      },
      error: (err) => {
        this.enviandoCodigo.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Cambiar Contraseña',
          mensaje: err?.error?.message || 'No se pudo enviar el código.',
        });
      },
    });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  iniciarMfa(): void {
    this.mfaCargando.set(true);
    this.mfaService.iniciar().subscribe({
      next: async (resp) => {
        this.mfaCargando.set(false);
        this.mfaSecretPlain.set(resp.secretPlain || '');
        try {
          const QRCode = (await import('qrcode')).default;
          const dataUrl = await QRCode.toDataURL(resp.otpAuthUri, {
            width: 220,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          this.mfaQrDataUrl.set(dataUrl);
        } catch {
          this.mfaQrDataUrl.set('');
        }
        this.mfaConfirmCode.set('');
        this.mfaUi.set('qr');
      },
      error: (err) => {
        this.mfaCargando.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Doble factor',
          mensaje: err?.error?.message || 'No se pudo iniciar la configuración.',
        });
      },
    });
  }

  soloNumerosMfa(event: Event): void {
    this.mfaConfirmCode.set(filtrarSoloDigitos(event, 6));
  }

  bloquearNoNumericoMfa(event: KeyboardEvent): void {
    bloquearTeclasNoNumericas(event);
  }

  confirmarMfa(): void {
    const codErr = errorCodigo6(this.mfaConfirmCode());
    if (codErr) {
      this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: codErr });
      return;
    }
    this.mfaCargando.set(true);
    this.mfaService.confirmar(this.mfaConfirmCode()).subscribe({
      next: (resp) => {
        this.mfaCargando.set(false);
        this.mfaEnabled.set(true);
        this.mfaBackupCodes.set(resp.backupCodes || []);
        this.mfaUi.set('backup');
        this.mfaSecretPlain.set('');
        this.mfaQrDataUrl.set('');
      },
      error: (err) => {
        this.mfaCargando.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Doble factor',
          mensaje: err?.error?.message || 'Código inválido o expirado.',
        });
      },
    });
  }

  cerrarMfaSetup(): void {
    this.mfaUi.set('idle');
    this.mfaBackupCodes.set([]);
    this.mfaConfirmCode.set('');
    this.mfaQrDataUrl.set('');
    this.mfaSecretPlain.set('');
    this.googleVerificadoMfa.set(false);
    this.googleVerificadoEliminar.set(false);
    this.googleLastAuth = null;
  }

  descargarCodigosRespaldo(): void {
    const codes = this.mfaBackupCodes();
    if (!codes.length) return;
    const contenido = [
      'Restaiuranteboard - Códigos de respaldo MFA',
      `Cuenta: ${this.form.email}`,
      '',
      ...codes.map((c, i) => `${i + 1}. ${c}`),
      '',
      'Cada código solo puede usarse una vez.',
    ].join('\n');
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restaiuranteboard-codigos-respaldo-mfa.txt';
    a.click();
    URL.revokeObjectURL(url);
    this.cerrarMfaSetup();
    this.modal.set({
      tipo: 'ok',
      titulo: 'Doble factor activado',
      mensaje: 'La autenticación de doble factor quedó habilitada en tu cuenta.',
    });
  }

  abrirDesactivarMfa(): void {
    this.mfaDisablePassword = '';
    this.mfaDisableCode = '';
    this.mfaDisableBackupCode = '';
    this.mfaUsarRespaldoDesactivar = false;
    this.googleVerificadoMfa.set(false);
    this.googleLastAuth = null;
    this.mfaUi.set('disable');
  }

  desactivarMfa(): void {
    const necesitaGoogle = !this.hasLocalPassword();
    if (!necesitaGoogle) {
      if (!this.mfaDisablePassword.trim()) {
        this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: 'Ingresa tu contraseña actual.' });
        return;
      }
      const codErr = errorCodigo6(this.mfaDisableCode);
      if (codErr) {
        this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: codErr });
        return;
      }
    } else {
      if (!this.googleVerificadoMfa()) {
        this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: 'Verifica tu identidad con Google.' });
        return;
      }
      if (!this.mfaUsarRespaldoDesactivar) {
        const codErr = errorCodigo6(this.mfaDisableCode);
        if (codErr) {
          this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: codErr });
          return;
        }
      } else if (!this.mfaDisableBackupCode.trim()) {
        this.modal.set({ tipo: 'error', titulo: 'Doble factor', mensaje: 'Ingresa un código de respaldo.' });
        return;
      }
    }
    this.mfaCargando.set(true);
    const payload: any = !necesitaGoogle
      ? { password: this.mfaDisablePassword, code: this.mfaDisableCode }
      : {
          ...(this.googleLastAuth || {}),
          ...(this.mfaUsarRespaldoDesactivar
            ? { backupCode: this.mfaDisableBackupCode.trim() }
            : { code: this.mfaDisableCode }),
        };
    this.mfaService.desactivar(payload).subscribe({
      next: () => {
        this.mfaCargando.set(false);
        this.mfaEnabled.set(false);
        this.mfaUi.set('idle');
        this.googleVerificadoMfa.set(false);
        this.googleLastAuth = null;
        this.modal.set({
          tipo: 'ok',
          titulo: 'Doble factor',
          mensaje: 'La autenticación de doble factor fue desactivada.',
        });
      },
      error: (err) => {
        this.mfaCargando.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Doble factor',
          mensaje: err?.error?.message || 'No se pudo desactivar.',
        });
      },
    });
  }

  soloNumerosDesactivarMfa(event: Event): void {
    this.mfaDisableCode = filtrarSoloDigitos(event, 6);
  }

  soloNumerosRespaldoDesactivar(event: Event): void {
    this.mfaDisableBackupCode = filtrarSoloDigitos(event, 9).toUpperCase();
  }

  abrirModalEliminar(): void {
    this.passwordEliminar = '';
    this.googleVerificadoEliminar.set(false);
    this.googleLastAuth = null;
    this.modalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.modalEliminar.set(false);
    this.passwordEliminar = '';
    this.googleVerificadoEliminar.set(false);
  }

  puedeConfirmarEliminar(): boolean {
    if (this.eliminando()) return false;
    if (this.hasLocalPassword()) {
      return this.passwordEliminar.trim().length > 0;
    }
    return this.googleVerificadoEliminar();
  }

  confirmarEliminarCuenta(): void {
    const necesitaGoogle = !this.hasLocalPassword();
    const password = this.passwordEliminar.trim();
    if (!necesitaGoogle && !password) {
      this.modal.set({ tipo: 'error', titulo: 'Eliminar cuenta', mensaje: 'Debes ingresar tu contraseña actual.' });
      return;
    }
    if (necesitaGoogle && !this.googleVerificadoEliminar()) {
      this.modal.set({ tipo: 'error', titulo: 'Eliminar cuenta', mensaje: 'Verifica tu identidad con Google.' });
      return;
    }
    this.eliminando.set(true);
    const payload: any = necesitaGoogle ? { ...(this.googleLastAuth || {}) } : { password };
    this.http.post<{ message: string }>(`${this.apiPerfil}/me/eliminar-cuenta`, payload).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.modalEliminar.set(false);
        this.cart.limpiarLocal();
        this.cart.clearPriceSnapshot();
        this.auth.destroyAllStorage();
        void this.router.navigate(['/presentacion']);
      },
      error: (err) => {
        this.eliminando.set(false);
        this.modalEliminar.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Eliminar cuenta',
          mensaje: err?.error?.message || 'No se pudo eliminar la cuenta.',
        });
      },
    });
  }

  verificarIdentidadConGoogle(para: 'eliminar' | 'mfa'): void {
    if (!this.googleAuth.enabled) {
      this.modal.set({ tipo: 'error', titulo: 'Google', mensaje: 'La verificación con Google no está configurada.' });
      return;
    }
    this.googleVerificando.set(true);
    this.googleAuth
      .requestAuth()
      .then((auth) => {
        const payload = auth.idToken ? { idToken: auth.idToken } : { googleCode: auth.code };
        this.http.post<{ verified: boolean }>(`${this.apiPerfil}/me/google/verificar-identidad`, payload).subscribe({
          next: () => {
            this.googleVerificando.set(false);
            this.googleLastAuth = payload;
            if (para === 'eliminar') {
              this.googleVerificadoEliminar.set(true);
            } else {
              this.googleVerificadoMfa.set(true);
            }
          },
          error: (err) => {
            this.googleVerificando.set(false);
            this.googleLastAuth = null;
            this.googleVerificadoEliminar.set(false);
            this.googleVerificadoMfa.set(false);
            this.modal.set({
              tipo: 'error',
              titulo: 'Google',
              mensaje: err?.error?.message || 'No se pudo verificar tu identidad.',
            });
          },
        });
      })
      .catch(() => {
        this.googleVerificando.set(false);
        this.modal.set({ tipo: 'error', titulo: 'Google', mensaje: 'Autenticación cancelada o no disponible.' });
      });
  }

  private cargarPerfil(): void {
    this.cargando.set(true);
    this.http.get<PerfilResponse>(`${this.apiPerfil}/me`).subscribe({
      next: (resp) => {
        this.cargando.set(false);
        this.aplicarRespuesta(resp);
      },
      error: (err) => {
        this.cargando.set(false);
        this.modal.set({
          tipo: 'error',
          titulo: 'Mi Perfil',
          mensaje: err?.error?.message || 'No se pudo cargar tu información.',
        });
      },
    });
  }

  private aplicarRespuesta(resp: PerfilResponse): void {
    this.form.fullName = String(resp?.fullName || '');
    this.form.phone = String(resp?.phone || '');
    this.form.address = String(resp?.address || '');
    this.form.dni = String(resp?.dni || '');
    this.form.email = String(resp?.email || '');
    this.form.role = String(resp?.role || '');
    this.canEditAddress.set(!!resp?.canEditAddress);
    this.roleVisible.set(this.form.role !== 'CLIENTE');
    this.esCliente.set(this.form.role === 'CLIENTE');
    this.mfaEnabled.set(!!resp?.mfaEnabled);
    this.hasLocalPassword.set(resp?.hasLocalPassword !== false);
  }
}
