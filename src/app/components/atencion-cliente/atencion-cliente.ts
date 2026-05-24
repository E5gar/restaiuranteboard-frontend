import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { CompradorNavComponent } from '../comprador-nav/comprador-nav';
import { AuthService } from '../../services/auth.service';
import {
  SoporteService,
  type PedidoRecienteDto,
} from '../../services/soporte.service';

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_OK = ['image/jpeg', 'image/jpg', 'image/png'];

export const CATEGORIAS_SOPORTE = [
  { value: 'PEDIDO_INCOMPLETO', label: 'Pedido incompleto (Falta un producto)' },
  { value: 'PEDIDO_INCORRECTO', label: 'Pedido incorrecto (Producto equivocado)' },
  { value: 'PEDIDO_MAL_ESTADO', label: 'Pedido en mal estado (Comida fria o en mal estado)' },
  { value: 'RETRASO_ENTREGA', label: 'Retraso con la entrega' },
  { value: 'INCONVENIENTE_REPARTIDOR', label: 'Inconveniente con el repartidor' },
  { value: 'ERROR_PAGO', label: 'Error en el pago' },
];

@Component({
  selector: 'app-atencion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent, CompradorNavComponent],
  templateUrl: './atencion-cliente.component.html',
  styleUrl: './atencion-cliente.css',
})
export class AtencionClienteComponent implements OnInit {
  private readonly soporte = inject(SoporteService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly categorias = CATEGORIAS_SOPORTE;
  readonly maxDesc = 500;

  paso = signal(1);
  cargandoPedidos = signal(true);
  pedidos = signal<PedidoRecienteDto[]>([]);
  orderId = '';
  categoria = '';
  descripcion = '';
  archivo: File | null = null;
  previewUrl: string | null = null;
  dragActivo = signal(false);
  enviando = signal(false);
  ticketCode = signal('');
  error = signal('');

  ngOnInit(): void {
    const s = this.auth.getSession();
    if (s?.role !== 'CLIENTE') {
      void this.router.navigate(['/menu']);
      return;
    }
    this.soporte.pedidosRecientes().subscribe({
      next: (rows) => {
        this.pedidos.set(rows ?? []);
        this.cargandoPedidos.set(false);
      },
      error: () => {
        this.pedidos.set([]);
        this.cargandoPedidos.set(false);
      },
    });
  }

  charsRestantes(): number {
    return Math.max(0, this.maxDesc - (this.descripcion?.length ?? 0));
  }

  siguientePaso(): void {
    this.error.set('');
    if (this.paso() === 1) {
      if (!this.orderId) {
        this.error.set('Selecciona un pedido.');
        return;
      }
      this.paso.set(2);
      return;
    }
    if (this.paso() === 2) {
      if (!this.categoria) {
        this.error.set('Selecciona una categoria.');
        return;
      }
      this.paso.set(3);
    }
  }

  pasoAnterior(): void {
    this.error.set('');
    if (this.paso() > 1) {
      this.paso.update((p) => p - 1);
    }
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) {
      this.validarYAsignar(f);
    }
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragActivo.set(false);
    const f = ev.dataTransfer?.files?.[0];
    if (f) {
      this.validarYAsignar(f);
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dragActivo.set(true);
  }

  onDragLeave(): void {
    this.dragActivo.set(false);
  }

  quitarArchivo(): void {
    this.archivo = null;
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  enviarReporte(): void {
    this.error.set('');
    const desc = (this.descripcion || '').trim();
    if (!this.orderId || !this.categoria) {
      this.error.set('Completa todos los pasos.');
      return;
    }
    if (!desc) {
      this.error.set('Describe el problema.');
      return;
    }
    if (desc.length > this.maxDesc) {
      this.error.set('La descripcion no puede superar 500 caracteres.');
      return;
    }
    const fd = new FormData();
    fd.append('orderId', this.orderId);
    fd.append('categoria', this.categoria);
    fd.append('descripcion', desc);
    if (this.archivo) {
      fd.append('evidencia', this.archivo, this.archivo.name);
    }
    this.enviando.set(true);
    this.soporte
      .crearTicket(fd)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (r) => {
          this.ticketCode.set(r.ticketCode);
          this.paso.set(4);
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.error.set(typeof msg === 'string' ? msg : 'No se pudo enviar el reporte.');
        },
      });
  }

  volverMenu(): void {
    void this.router.navigate(['/menu']);
  }

  private validarYAsignar(f: File): void {
    this.quitarArchivo();
    const type = (f.type || '').toLowerCase();
    const okMime = MIME_OK.some((m) => type === m || (m === 'image/jpg' && type === 'image/jpeg'));
    if (!okMime) {
      this.error.set('Solo se permiten imagenes JPG o PNG.');
      return;
    }
    if (f.size > MAX_BYTES) {
      this.error.set('La imagen no debe pesar mas de 5MB.');
      return;
    }
    this.archivo = f;
    this.previewUrl = URL.createObjectURL(f);
    this.error.set('');
  }
}
