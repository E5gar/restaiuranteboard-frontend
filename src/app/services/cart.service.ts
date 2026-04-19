import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const MAX_UNIDADES_POR_PRODUCTO = 10;

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  thumbSrc: string;
}

export interface CarritoResponseDto {
  items: CartLine[];
}

export interface ProductoCarritoInput {
  id: string;
  name?: string;
  price?: number;
  imagesBase64?: string[] | null;
}

export interface VerificarPreciosResponseDto {
  preciosCambiaron: boolean;
  totalAnterior: number;
  totalNuevo: number;
  detalleCambios: { nombre: string; precioAnterior: number; precioNuevo: number }[];
  carritoActualizado: CarritoResponseDto;
}

const API_CARRITO = 'https://restaiuranteboard-backend.onrender.com/api/carrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly lines = signal<CartLine[]>([]);
  readonly sincronizando = signal(false);

  readonly items = this.lines.asReadonly();

  readonly totalUnidades = computed(() => this.lines().reduce((s, l) => s + l.quantity, 0));

  readonly totalOrden = computed(() =>
    this.lines().reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  );

  subtotalLinea(line: CartLine): number {
    return line.unitPrice * line.quantity;
  }

  /** Sustituye el estado local con la respuesta del backend (precios/nombres en tiempo real). */
  applyCarritoResponse(resp: CarritoResponseDto | null | undefined): void {
    const items = resp?.items;
    if (!items || !Array.isArray(items)) {
      this.lines.set([]);
      return;
    }
    const mapped = items.map((x: CartLine) => ({
      productId: x.productId,
      quantity: Math.min(MAX_UNIDADES_POR_PRODUCTO, Math.max(0, Number(x.quantity) || 0)),
      name: String(x.name ?? ''),
      unitPrice: Number(x.unitPrice) || 0,
      thumbSrc: String(x.thumbSrc ?? 'assets/no-image.png'),
    }));
    this.lines.set(mapped);
  }

  /** Tras login exitoso: hidrata desde el payload del endpoint /login. */
  applyFromLoginPayload(user: { role?: string; cart?: CarritoResponseDto } | null | undefined): void {
    if (!user || user.role !== 'CLIENTE') {
      this.lines.set([]);
      return;
    }
    this.applyCarritoResponse(user.cart ?? { items: [] });
  }

  limpiarLocal(): void {
    this.lines.set([]);
  }

  puedeSincronizar(): boolean {
    const s = this.auth.getSession();
    return s?.role === 'CLIENTE' && !!s?.userId;
  }

  private requireClienteUserId(): string {
    const s = this.auth.getSession();
    if (s?.role !== 'CLIENTE' || !s.userId) {
      throw new Error('Sesión de cliente no disponible.');
    }
    return s.userId;
  }

  cargarDesdeServidor(userId: string): Observable<void> {
    if (!userId) {
      this.limpiarLocal();
      return of(void 0);
    }
    this.sincronizando.set(true);
    return this.http.get<CarritoResponseDto>(`${API_CARRITO}`, { params: { userId } }).pipe(
      tap((r) => this.applyCarritoResponse(r)),
      map(() => void 0),
      catchError(() => {
        this.limpiarLocal();
        return of(void 0);
      }),
      finalize(() => this.sincronizando.set(false)),
    );
  }

  private postMutation(obs: Observable<CarritoResponseDto>): Observable<void> {
    this.sincronizando.set(true);
    return obs.pipe(
      tap((r) => this.applyCarritoResponse(r)),
      map(() => void 0),
      catchError((err) => throwError(() => err)),
      finalize(() => this.sincronizando.set(false)),
    );
  }

  agregarUno(p: ProductoCarritoInput): Observable<void> {
    if (!this.puedeSincronizar()) {
      return throwError(() => new Error('Carrito solo para clientes.'));
    }
    const uid = this.requireClienteUserId();
    return this.postMutation(
      this.http.post<CarritoResponseDto>(`${API_CARRITO}/agregar`, {
        userId: uid,
        productId: p.id,
      }),
    );
  }

  incrementar(productId: string): Observable<void> {
    if (!this.puedeSincronizar()) {
      return throwError(() => new Error('Carrito solo para clientes.'));
    }
    const uid = this.requireClienteUserId();
    return this.postMutation(
      this.http.post<CarritoResponseDto>(`${API_CARRITO}/incrementar`, {
        userId: uid,
        productId,
      }),
    );
  }

  decrementar(productId: string): Observable<void> {
    if (!this.puedeSincronizar()) {
      return throwError(() => new Error('Carrito solo para clientes.'));
    }
    const uid = this.requireClienteUserId();
    return this.postMutation(
      this.http.post<CarritoResponseDto>(`${API_CARRITO}/decrementar`, {
        userId: uid,
        productId,
      }),
    );
  }

  quitar(productId: string): Observable<void> {
    if (!this.puedeSincronizar()) {
      return throwError(() => new Error('Carrito solo para clientes.'));
    }
    const uid = this.requireClienteUserId();
    return this.postMutation(
      this.http.post<CarritoResponseDto>(`${API_CARRITO}/eliminar`, {
        userId: uid,
        productId,
      }),
    );
  }

  verificarPreciosCheckout(): Observable<VerificarPreciosResponseDto> {
    const uid = this.requireClienteUserId();
    const lineasCliente = this.lines().map((l) => ({
      productId: l.productId,
      precioUnitario: l.unitPrice,
      cantidad: l.quantity,
    }));
    const totalCliente = this.totalOrden();
    return this.http
      .post<VerificarPreciosResponseDto>(`${API_CARRITO}/verificar-precios`, {
        userId: uid,
        lineasCliente,
        totalCliente,
      })
      .pipe(
        tap((res) => {
          if (res.carritoActualizado) {
            this.applyCarritoResponse(res.carritoActualizado);
          }
        }),
      );
  }
}
