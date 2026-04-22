import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { AuthService } from '../../services/auth.service';
import { timer } from 'rxjs';

const API_SEG = 'https://restaiuranteboard-backend.onrender.com/api/pedidos/seguimiento';

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
        this.data.set(r);
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
}
