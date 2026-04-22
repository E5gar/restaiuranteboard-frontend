import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { AuthService } from '../../services/auth.service';
import { timer } from 'rxjs';

const API_SEG = 'https://restaiuranteboard-backend.onrender.com/api/pedidos/seguimiento';
const API_CAL = 'https://restaiuranteboard-backend.onrender.com/api/pedidos/calificacion';

type Estado = 'VALIDANDO_PAGO' | 'PAGO_VALIDADO' | 'EN_COCINA' | 'PREPARADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

interface Linea {
  nombreProducto: string;
  cantidad: number;
  precioUnitario: string;
  subtotal: string;
}

interface SeguimientoResp {
  orderId: string;
  estado: Estado;
  createdAt: string;
  total: string;
  cancelReason: string;
  repartidorNombre: string;
  isRated: boolean;
  lineas: Linea[];
}

@Component({
  selector: 'app-seguimiento-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoutButtonComponent],
  templateUrl: './seguimiento-pedido.component.html',
})
export class SeguimientoPedidoComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly data = signal<SeguimientoResp | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly animar = signal(false);

  modalCalif = false;
  estrellasSel = 0;
  comentarioCalif = '';
  enviandoCalif = false;
  errorCalif = '';

  readonly pasos = [
    { key: 'VALIDANDO_PAGO', label1: 'Validando', label2: 'Pago', icon: '/iconos/documento.png' },
    { key: 'PAGO_VALIDADO', label1: 'Pago', label2: 'Validado', icon: '/iconos/billetes-soles.png' },
    { key: 'EN_COCINA', label1: 'En', label2: 'Cocina', icon: '/iconos/plato.png' },
    { key: 'PREPARADO', label1: 'Preparado', label2: '', icon: '/iconos/destellos-recomendaciones.png' },
    { key: 'EN_CAMINO', label1: 'En', label2: 'Camino', icon: '/iconos/camion-abastecer-ingrediente.png' },
    { key: 'ENTREGADO', label1: 'Entregado', label2: '', icon: '/iconos/like-pulgar.png' },
  ] as const;

  ngOnInit(): void {
    timer(0, 15000).subscribe(() => this.cargar());
  }

  formatoMoneda(v: string): string {
    const n = Number(v);
    if (Number.isNaN(n)) return v;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);
  }

  idxEstado(): number {
    const s = this.data()?.estado;
    if (!s || s === 'CANCELADO') return -1;
    return this.pasos.findIndex((p) => p.key === s);
  }

  estadoMsg(): string {
    const s = this.data()?.estado;
    if (s === 'VALIDANDO_PAGO') return 'Estamos revisando tu comprobante de pago.';
    if (s === 'PAGO_VALIDADO') return 'Pago confirmado. Tu pedido ingresó a cocina.';
    if (s === 'EN_COCINA') return 'Tu comida se está cocinando con amor.';
    if (s === 'PREPARADO') return 'Tu pedido está listo y buscando repartidor.';
    if (s === 'EN_CAMINO') return 'El repartidor está a unas cuadras de tu casa.';
    if (s === 'ENTREGADO') return '¡Pedido entregado con éxito!';
    return 'Tu pedido fue cancelado por validación de pago.';
  }

  private cargar(): void {
    const uid = this.auth.getSession()?.userId;
    if (!uid) {
      this.cargando.set(false);
      this.error.set('Debes iniciar sesión para ver el seguimiento.');
      return;
    }
    this.http.get<SeguimientoResp>(`${API_SEG}/actual`, { params: { userId: uid } }).subscribe({
      next: (r) => {
        const prev = this.data()?.estado;
        this.data.set({ ...r, isRated: r.isRated ?? false });
        this.cargando.set(false);
        this.error.set('');
        if (prev && prev !== r.estado) {
          this.animar.set(true);
          setTimeout(() => this.animar.set(false), 1000);
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el seguimiento.');
      },
    });
  }

  abrirCalificacion(): void {
    this.estrellasSel = 0;
    this.comentarioCalif = '';
    this.errorCalif = '';
    this.modalCalif = true;
  }

  cerrarCalificacion(): void {
    if (this.enviandoCalif) return;
    this.modalCalif = false;
  }

  setEstrella(n: number): void {
    this.estrellasSel = n;
    this.errorCalif = '';
  }

  enviarCalificacion(): void {
    const uid = this.auth.getSession()?.userId;
    const d = this.data();
    if (!uid || !d) return;
    if (this.estrellasSel < 1 || this.estrellasSel > 5) {
      this.errorCalif = 'Selecciona entre 1 y 5 estrellas.';
      return;
    }
    this.enviandoCalif = true;
    this.errorCalif = '';
    const c = this.comentarioCalif.trim();
    this.http
      .post<{ ok?: boolean }>(API_CAL, {
        userId: uid,
        orderId: d.orderId,
        stars: this.estrellasSel,
        comment: c.length > 0 ? c : null,
      })
      .subscribe({
        next: () => {
          this.enviandoCalif = false;
          this.modalCalif = false;
          this.data.set({ ...d, isRated: true });
        },
        error: (err) => {
          this.enviandoCalif = false;
          this.errorCalif = err.error?.message || 'No se pudo enviar la calificación.';
        },
      });
  }
}
