import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { CompradorNavComponent } from '../comprador-nav/comprador-nav';
import { SoporteService, type TicketAdminDto } from '../../services/soporte.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-admin-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent, CompradorNavComponent],
  templateUrl: './admin-soporte.component.html',
})
export class AdminSoporteComponent implements OnInit {
  private readonly soporte = inject(SoporteService);
  private readonly ws = inject(WebsocketService);
  private readonly destroyRef = inject(DestroyRef);

  cargando = signal(true);
  tickets = signal<TicketAdminDto[]>([]);
  ticketSeleccionado = signal<TicketAdminDto | null>(null);
  evidenciaUrl = signal<string | null>(null);
  mensajeCierre = '';
  cerrando = signal(false);
  modalCerrar = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.cargarTickets();
    this.ws
      .subscribeToTopic('/topic/admin/soporte')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarTickets());
  }

  cargarTickets(): void {
    this.cargando.set(true);
    this.soporte
      .listarTicketsAdmin()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (rows) => this.tickets.set(rows ?? []),
        error: () => this.tickets.set([]),
      });
  }

  abrirDetalle(t: TicketAdminDto): void {
    this.ticketSeleccionado.set(t);
    this.evidenciaUrl.set(null);
    if (t.tieneEvidencia) {
      this.soporte.evidencia(t.id).subscribe({
        next: (r) => this.evidenciaUrl.set(r.dataUrl),
        error: () => this.evidenciaUrl.set(null),
      });
    }
  }

  cerrarDetalle(): void {
    this.ticketSeleccionado.set(null);
    this.evidenciaUrl.set(null);
  }

  abrirModalCerrar(t: TicketAdminDto): void {
    this.ticketSeleccionado.set(t);
    this.mensajeCierre = '';
    this.error.set('');
    this.modalCerrar.set(true);
  }

  confirmarCierre(): void {
    const t = this.ticketSeleccionado();
    const msg = (this.mensajeCierre || '').trim();
    if (!t) return;
    if (!msg) {
      this.error.set('Escribe la justificacion del cierre.');
      return;
    }
    this.cerrando.set(true);
    this.soporte
      .cerrarTicket(t.id, msg)
      .pipe(finalize(() => this.cerrando.set(false)))
      .subscribe({
        next: () => {
          this.modalCerrar.set(false);
          this.ticketSeleccionado.set(null);
          this.cargarTickets();
        },
        error: (err) => {
          const m = err?.error?.message;
          this.error.set(typeof m === 'string' ? m : 'No se pudo cerrar el ticket.');
        },
      });
  }

  esPendiente(t: TicketAdminDto): boolean {
    return t.status === 'PENDIENTE';
  }
}
