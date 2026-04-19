import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { CartService, MAX_UNIDADES_POR_PRODUCTO } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

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
  precioFiltroMin = signal(0);
  precioFiltroMax = signal(0);

  carritoAbierto = signal(false);
  modalProducto = signal<MenuProducto | null>(null);
  indiceCarrusel = signal(0);

  /** Modal tras verificar precios en checkout (cambios respecto al catálogo actual). */
  modalPreciosCheckout = signal<{
    detalle: { nombre: string; precioAnterior: number; precioNuevo: number }[];
    totalAnterior: number;
    totalNuevo: number;
  } | null>(null);

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
    }
  }

  esClienteConCarrito(): boolean {
    return this.cart.puedeSincronizar();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.errorCarga = false;
    this.http.get<MenuProducto[]>(`${this.apiCatalogo}/productos`).subscribe({
      next: (data) => {
        const rows = (data || []).map((p) => ({
          ...p,
          imagesBase64: Array.isArray(p.imagesBase64) ? p.imagesBase64 : [],
          description: p.description ?? '',
        }));
        this.productos.set(rows);
        const prices = rows.map((p) => Number(p.price)).filter((n) => !Number.isNaN(n));
        if (prices.length > 0) {
          const mn = Math.min(...prices);
          const mx = Math.max(...prices);
          this.precioDbMin.set(mn);
          this.precioDbMax.set(mx);
          this.precioFiltroMin.set(mn);
          this.precioFiltroMax.set(mx);
        } else {
          this.precioDbMin.set(0);
          this.precioDbMax.set(0);
          this.precioFiltroMin.set(0);
          this.precioFiltroMax.set(0);
        }
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = true;
        this.cargando = false;
      },
    });
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
    const hi = this.precioDbMax();
    let a = Math.min(Math.max(minRaw, lo), hi);
    let b = Math.min(Math.max(maxRaw, lo), hi);
    if (a > b) {
      b = a;
    }
    this.precioFiltroMin.set(a);
    this.precioFiltroMax.set(b);
  }

  abrirDetalle(p: MenuProducto): void {
    this.modalProducto.set(p);
    this.indiceCarrusel.set(0);
  }

  cerrarDetalle(): void {
    this.modalProducto.set(null);
  }

  carruselAnterior(): void {
    const p = this.modalProducto();
    if (!p) return;
    const imgs = this.imagenesModal(p);
    const i = this.indiceCarrusel();
    this.indiceCarrusel.set((i - 1 + imgs.length) % imgs.length);
  }

  carruselSiguiente(): void {
    const p = this.modalProducto();
    if (!p) return;
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

  agregarAlCarrito(p: MenuProducto): void {
    if (!this.esClienteConCarrito()) {
      return;
    }
    this.cart.agregarUno({ id: p.id }).subscribe({ error: () => {} });
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

  intentarCheckout(): void {
    if (!this.esClienteConCarrito() || this.cart.items().length === 0) {
      return;
    }
    this.cart.verificarPreciosCheckout().subscribe({
      next: (r) => {
        if (r.preciosCambiaron) {
          this.modalPreciosCheckout.set({
            detalle: r.detalleCambios ?? [],
            totalAnterior: r.totalAnterior,
            totalNuevo: r.totalNuevo,
          });
        }
      },
      error: () => {},
    });
  }

  cerrarModalPreciosCheckout(): void {
    this.modalPreciosCheckout.set(null);
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
