import { Component, DestroyRef, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { SoporteService } from '../../services/soporte.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-comprador-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './comprador-nav.component.html',
})
export class CompradorNavComponent implements OnInit, OnDestroy {
  @Input() variant: 'primary' | 'secondary' = 'primary';
  @Output() carritoClick = new EventEmitter<void>();

  readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly soporte = inject(SoporteService);
  private readonly ws = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);

  rutaPanelTrabajo: string | null = null;
  mostrarMenu = true;
  mostrarMiPerfil = true;
  mostrarAtencionCliente = false;
  mostrarSoporteAdmin = false;
  soportePendientes = 0;
  carritoModoPanel = false;
  mostrarPanelTrabajo = false;

  ngOnInit(): void {
    this.rutaPanelTrabajo = this.auth.getWorkPanelPath();
    this.actualizarVisibilidad();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.actualizarVisibilidad());
    const uid = this.auth.getSession()?.userId;
    if (uid && this.cart.puedeSincronizar()) {
      this.cart.cargarDesdeServidor(uid).subscribe();
    }
    const role = this.auth.getSession()?.role;
    if (role === 'ADMIN') {
      this.cargarPendientesSoporte();
      this.ws
        .subscribeToTopic('/topic/admin/soporte')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cargarPendientesSoporte());
    }
  }

  ngOnDestroy(): void {}

  onCarritoClick(): void {
    this.carritoClick.emit();
  }

  claseEnlace(): string {
    if (this.variant === 'secondary') {
      return 'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25 sm:w-max';
    }
    return 'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-dark-border dark:bg-slate-900 dark:text-dark-text-strong dark:shadow-none dark:hover:bg-slate-800 sm:w-max';
  }

  private cargarPendientesSoporte(): void {
    this.soporte.pendientesCount().subscribe({
      next: (r) => (this.soportePendientes = r?.pendientes ?? 0),
      error: () => (this.soportePendientes = 0),
    });
  }

  private actualizarVisibilidad(): void {
    const actual = this.router.url.split('?')[0];
    const role = this.auth.getSession()?.role;
    this.mostrarMenu = actual !== '/menu';
    this.mostrarMiPerfil = actual !== '/mi-perfil';
    this.mostrarAtencionCliente = role === 'CLIENTE' && actual !== '/atencion-cliente';
    this.mostrarSoporteAdmin = role === 'ADMIN' && actual !== '/admin-soporte';
    this.carritoModoPanel = actual === '/menu';
    this.mostrarPanelTrabajo = !!this.rutaPanelTrabajo && actual !== this.rutaPanelTrabajo;
  }
}
