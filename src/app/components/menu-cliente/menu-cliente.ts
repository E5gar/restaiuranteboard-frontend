import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { CartService, MAX_UNIDADES_POR_PRODUCTO, type VerificarPreciosResponseDto } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { UserInteractionsService } from '../../services/user-interactions.service';
import { WebsocketService } from '../../services/websocket.service';

export interface CatOpcion {
  value: string;
  label: string;
  img: string;
}

export interface MenuProducto {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imagesBase64: string[];
}

@Component({
  selector: 'app-menu-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './menu-cliente.component.html',
  styleUrl: './menu-cliente.css',
})
export class MenuClienteComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly interactions = inject(UserInteractionsService);
  private readonly ws = inject(WebsocketService);
  readonly cart = inject(CartService);

  private readonly apiCatalogo = 'https://restaiuranteboard-backend.onrender.com/api/catalogo';

  readonly categoriasProducto: CatOpcion[] = [
    { value: 'Entrada', label: 'Entradas', img: '/iconos/categoria-entrada.png' },
    { value: 'Plato Principal', label: 'Platos Principales', img: '/iconos/categoria-plato-principal.png' },
    { value: 'Postres', label: 'Postres', img: '/iconos/categoria-postres.png' },
    { value: 'Bebidas', label: 'Bebidas', img: '/iconos/categoria-bebidas.png' },
  ];

  readonly maxPorProducto = MAX_UNIDADES_POR_PRODUCTO;

  cargando = true;
  errorCarga = false;

  productos = signal<MenuProducto[]>([]);

  busqueda = '';
  filtroCategoria: string | 'ALL' = 'ALL';

  precioDbMin = signal(0);
  precioDbMax = signal(0);
  precioSliderMax = signal(0);
  precioFiltroMin = signal(0);
  precioFiltroMax = signal(0);

  agregandoProductId = signal<string | null>(null);

  private origenModalPrecios: 'pago' | 'background' | null = null;

  carritoAbierto = signal(false);
  modalProducto = signal<MenuProducto | null>(null);
  indiceCarrusel = signal(0);

  modalPreciosCheckout = signal<{
    detalle: { nombre: string; precioAnterior: number; precioNuevo: number }[];
    totalAnterior: number;
    totalNuevo: number;
  } | null>(null);

  modalPreCheckoutDisponibilidad = signal<string[] | null>(null);
  modalDisponibilidadMenu = signal<string[] | null>(null);
  modalCarritoVacio = signal(false);
  private detalleAbiertoAtMs = 0;
  private detalleProductId: string | null = null;
  private detalleAgregoCarrito = false;

  private pendingPreciosTrasDisponibilidadMenu: VerificarPreciosResponseDto | null = null;
  private pendingPreciosTrasDisponibilidadPreCheckout: VerificarPreciosResponseDto | null = null;

  get productosFiltrados(): MenuProducto[] {
    const lista = this.productos();
    const q = (this.busqueda || '').trim().toLowerCase();
    const cat = this.filtroCategoria;
    const minF = this.precioFiltroMin();
    const maxF = this.precioFiltroMax();
    return lista.filter((p) => {
      if (cat !== 'ALL' && p.category !== cat) return false;
      if (
        q &&
        !String(p.name || '')
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      const pr = Number(p.price);
      if (Number.isNaN(pr)) return false;
      return pr >= minF && pr <= maxF;
    });
  }

  ngOnInit(): void {
    this.cargarProductos();
    const s = this.auth.getSession();
    if (s?.role === 'CLIENTE' && s.userId) {
      this.cart.cargarDesdeServidor(s.userId).subscribe();
      this.iniciarEscuchaCambiosTiempoReal(s.userId);
    }
  }

  private iniciarEscuchaCambiosTiempoReal(userId: string): void {
    this.ws
      .subscribeToTopic('/topic/catalogo')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.esClienteConCarrito()),
        switchMap(() => {
          this.cargarProductos(true);
          return this.ejecutarSincronizacionCarritoEnMenu(userId);
        }),
      )
      .subscribe();
  }

  private ejecutarSincronizacionCarritoEnMenu(userId: string): Observable<void> {
    if (this.cart.items().length === 0) {
      return this.cart.cargarDesdeServidor(userId).pipe(
        tap((meta) => {
          if (meta.removedItems.length > 0) {
            this.modalDisponibilidadMenu.set(meta.removedItems);
          }
        }),
        map(() => void 0),
      );
    }
    return this.cart.verificarPreciosCheckout().pipe(
      switchMap((r) =>
        this.cart.cargarDesdeServidor(userId).pipe(map((meta) => ({ r, meta }))),
      ),
      tap(({ r, meta }) => {
        const rem = [...new Set([...(r.carritoActualizado?.removedItems ?? []), ...meta.removedItems])];
        if (rem.length > 0) {
          this.modalDisponibilidadMenu.set(rem);
          if (r.preciosCambiaron) {
            this.pendingPreciosTrasDisponibilidadMenu = r;
          }
        } else if (r.preciosCambiaron) {
          this.abrirModalPreciosCambio(r, 'background');
        }
      }),
      map(() => void 0),
    );
  }

  private abrirModalPreciosCambio(r: VerificarPreciosResponseDto, origen: 'pago' | 'background'): void {
    this.origenModalPrecios = origen;
    this.modalPreciosCheckout.set({
      detalle: r.detalleCambios ?? [],
      totalAnterior: r.totalAnterior,
      totalNuevo: r.totalNuevo,
    });
  }

  sliderTrackStyle(): { [key: string]: string } {
    const min = this.precioDbMin();
    const max = this.precioSliderMax();
    const val = this.precioFiltroMax();
    if (max <= min) {
      return { background: '#e5e7eb' };
    }
    const pct = ((val - min) / (max - min)) * 100;
    const rest = document.documentElement.classList.contains('dark') ? '#334155' : '#e5e7eb';
    return {
      background: `linear-gradient(to right, #ff7a00 ${pct}%, ${rest} ${pct}%)`,
    };
  }

  cerrarModalDisponibilidadMenu(): void {
    this.modalDisponibilidadMenu.set(null);
    const pending = this.pendingPreciosTrasDisponibilidadMenu;
    this.pendingPreciosTrasDisponibilidadMenu = null;
    if (pending?.preciosCambiaron) {
      this.abrirModalPreciosCambio(pending, 'background');
    }
  }

  esClienteConCarrito(): boolean {
    return this.cart.puedeSincronizar();
  }

  cargarProductos(silent = false): void {
    if (!silent) {
      this.cargando = true;
      this.errorCarga = false;
    }
    this.http.get<MenuProducto[]>(`${this.apiCatalogo}/productos`).subscribe({
      next: (data) => {
        const rows = (data || []).map((p) => ({
          ...p,
          imagesBase64: Array.isArray(p.imagesBase64) ? p.imagesBase64 : [],
          description: p.description ?? '',
        }));
        this.productos.set(rows);
        this.sincronizarModalProductoTrasCatalogo();
        const prices = rows.map((p) => Number(p.price)).filter((n) => !Number.isNaN(n));
        if (prices.length > 0) {
          const mn = Math.min(...prices);
          const mx = Math.max(...prices);
          this.precioDbMin.set(mn);
          this.precioDbMax.set(mx);
          this.precioSliderMax.set(mx + 2);
          if (!silent) {
            this.precioFiltroMin.set(mn);
            this.precioFiltroMax.set(mx);
          } else {
            this.ajustarRangoPrecio(this.precioFiltroMin(), this.precioFiltroMax());
          }
        } else {
          this.precioDbMin.set(0);
          this.precioDbMax.set(0);
          this.precioSliderMax.set(2);
          if (!silent) {
            this.precioFiltroMin.set(0);
            this.precioFiltroMax.set(0);
          }
        }
        if (!silent) {
          this.cargando = false;
        }
      },
      error: () => {
        if (!silent) {
          this.errorCarga = true;
          this.cargando = false;
        }
      },
    });
  }

  private sincronizarModalProductoTrasCatalogo(): void {
    const abierto = this.modalProducto();
    if (!abierto) {
      return;
    }
    const actualizado = this.productos().find((p) => p.id === abierto.id);
    if (actualizado) {
      this.modalProducto.set(actualizado);
    } else {
      this.modalProducto.set(null);
    }
  }

  imgIconoProducto(categoria: string): string {
    return this.categoriasProducto.find((x) => x.value === categoria)?.img ?? '/iconos/lupa.png';
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
  }

  primeraImagen(p: MenuProducto): string {
    const arr = p.imagesBase64;
    if (arr && arr.length > 0 && arr[0]) return arr[0];
    return 'assets/no-image.png';
  }

  imagenesModal(p: MenuProducto): string[] {
    const arr = (p.imagesBase64 || []).filter((x) => !!x && String(x).trim().length > 0);
    return arr.length > 0 ? arr : ['assets/no-image.png'];
  }

  seleccionarCategoria(val: string | 'ALL'): void {
    this.filtroCategoria = val;
  }

  onPrecioMinInput(v: string | number): void {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    if (Number.isNaN(n)) return;
    this.ajustarRangoPrecio(n, this.precioFiltroMax());
  }

  onPrecioMaxInput(v: string | number): void {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    if (Number.isNaN(n)) return;
    this.ajustarRangoPrecio(this.precioFiltroMin(), n);
  }

  private ajustarRangoPrecio(minRaw: number, maxRaw: number): void {
    const lo = this.precioDbMin();
    const hiDb = this.precioDbMax();
    const hiSlider = this.precioSliderMax();
    let a = Math.min(Math.max(minRaw, lo), hiDb);
    let b = Math.min(Math.max(maxRaw, lo), hiSlider);
    if (a > b) {
      b = a;
    }
    this.precioFiltroMin.set(a);
    this.precioFiltroMax.set(b);
  }

  abrirDetalle(p: MenuProducto): void {
    this.detalleAbiertoAtMs = Date.now();
    this.detalleProductId = p.id;
    this.detalleAgregoCarrito = false;
    this.interactions.track(p.id, 'VIEW_DETAIL');
    this.modalProducto.set(p);
    this.indiceCarrusel.set(0);
  }

  cerrarDetalle(): void {
    if (this.detalleProductId) {
      const dwell = Math.max(0, Math.round((Date.now() - this.detalleAbiertoAtMs) / 1000));
      if (!this.detalleAgregoCarrito) {
        this.interactions.track(this.detalleProductId, 'CLOSE_DETAIL_WITHOUT_ADD', dwell);
      }
    }
    this.detalleAbiertoAtMs = 0;
    this.detalleProductId = null;
    this.detalleAgregoCarrito = false;
    this.modalProducto.set(null);
  }

  carruselAnterior(): void {
    const p = this.modalProducto();
    if (!p) return;
    this.interactions.track(p.id, 'IMAGE_SWIPE');
    const imgs = this.imagenesModal(p);
    const i = this.indiceCarrusel();
    this.indiceCarrusel.set((i - 1 + imgs.length) % imgs.length);
  }

  carruselSiguiente(): void {
    const p = this.modalProducto();
    if (!p) return;
    this.interactions.track(p.id, 'IMAGE_SWIPE');
    const imgs = this.imagenesModal(p);
    const i = this.indiceCarrusel();
    this.indiceCarrusel.set((i + 1) % imgs.length);
  }

  abrirCarrito(): void {
    this.carritoAbierto.set(true);
  }

  cerrarCarrito(): void {
    this.carritoAbierto.set(false);
  }

  agregarAlCarrito(p: MenuProducto, cerrarModalDetalle = false): void {
    if (!this.esClienteConCarrito()) {
      return;
    }
    if (this.agregandoProductId()) {
      return;
    }
    this.agregandoProductId.set(p.id);
    this.cart.agregarUno({ id: p.id }).subscribe({
      next: () => {
        this.detalleAgregoCarrito = true;
        this.agregandoProductId.set(null);
        if (cerrarModalDetalle) {
          this.cerrarDetalle();
        }
      },
      error: () => this.agregandoProductId.set(null),
    });
  }

  onIncrementarLinea(productId: string): void {
    if (!this.esClienteConCarrito()) {
      return;
    }
    this.cart.incrementar(productId).subscribe({ error: () => {} });
  }

  onDecrementarLinea(productId: string): void {
    if (!this.esClienteConCarrito()) {
      return;
    }
    this.cart.decrementar(productId).subscribe({ error: () => {} });
  }

  onQuitarLinea(productId: string): void {
    if (!this.esClienteConCarrito()) {
      return;
    }
    this.cart.quitar(productId).subscribe({ error: () => {} });
  }

  continuarAlPago(): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    if (!this.esClienteConCarrito()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    const uid = this.auth.getSession()?.userId;
    if (!uid) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.cart
      .verificarPreciosCheckout()
      .pipe(
        switchMap((r) => this.cart.cargarDesdeServidor(uid).pipe(map((meta) => ({ r, meta })))),
      )
      .subscribe({
        next: ({ r, meta }) => {
          const rem = [...new Set([...(r.carritoActualizado?.removedItems ?? []), ...meta.removedItems])];
          if (rem.length > 0) {
            this.modalPreCheckoutDisponibilidad.set(rem);
            if (r.preciosCambiaron) {
              this.pendingPreciosTrasDisponibilidadPreCheckout = r;
            }
            return;
          }
          if (r.preciosCambiaron) {
            this.abrirModalPreciosCambio(r, 'pago');
            return;
          }
          if (this.cart.items().length === 0) {
            this.modalCarritoVacio.set(true);
            return;
          }
          void this.router.navigate(['/checkout']);
        },
        error: () => {},
      });
  }

  continuarTrasDisponibilidadPreCheckout(): void {
    this.modalPreCheckoutDisponibilidad.set(null);
    const pending = this.pendingPreciosTrasDisponibilidadPreCheckout;
    this.pendingPreciosTrasDisponibilidadPreCheckout = null;
    if (pending?.preciosCambiaron) {
      this.abrirModalPreciosCambio(pending, 'pago');
      return;
    }
    if (this.cart.items().length === 0) {
      this.modalCarritoVacio.set(true);
      return;
    }
    void this.router.navigate(['/checkout']);
  }

  cerrarModalCarritoVacio(): void {
    this.modalCarritoVacio.set(false);
  }

  cerrarModalPreciosCheckout(): void {
    const irCheckout = this.origenModalPrecios === 'pago';
    this.origenModalPrecios = null;
    this.modalPreciosCheckout.set(null);
    if (irCheckout) {
      void this.router.navigate(['/checkout']);
    }
  }

  nombresCambioPrecio(): string {
    const m = this.modalPreciosCheckout();
    if (!m?.detalle?.length) {
      return '';
    }
    return m.detalle.map((d) => d.nombre).join(', ');
  }

  cantidadEnCarrito(productId: string): number {
    return this.cart.items().find((l) => l.productId === productId)?.quantity ?? 0;
  }

}
