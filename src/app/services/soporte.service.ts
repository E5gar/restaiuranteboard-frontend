import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PedidoRecienteDto {
  orderId: string;
  label: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface TicketCreadoDto {
  ticketId: string;
  ticketCode: string;
  status: string;
}

export interface TicketAdminDto {
  id: string;
  ticketCode: string;
  clientName: string;
  clientEmail: string;
  orderId: string;
  orderResumen: string;
  categoria: string;
  categoriaLabel: string;
  descripcion: string;
  tieneEvidencia: boolean;
  status: string;
  cierreMensaje?: string;
  cerradoPorEmail?: string;
  createdAt?: string;
  closedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SoporteService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/soporte';

  pedidosRecientes(): Observable<PedidoRecienteDto[]> {
    return this.http.get<PedidoRecienteDto[]>(`${this.base}/cliente/pedidos-recientes`);
  }

  crearTicket(fd: FormData): Observable<TicketCreadoDto> {
    return this.http.post<TicketCreadoDto>(`${this.base}/cliente/tickets`, fd);
  }

  pendientesCount(): Observable<{ pendientes: number }> {
    return this.http.get<{ pendientes: number }>(`${this.base}/admin/pendientes-count`);
  }

  listarTicketsAdmin(): Observable<TicketAdminDto[]> {
    return this.http.get<TicketAdminDto[]>(`${this.base}/admin/tickets`);
  }

  evidencia(ticketId: string): Observable<{ dataUrl: string }> {
    return this.http.get<{ dataUrl: string }>(`${this.base}/admin/tickets/${encodeURIComponent(ticketId)}/evidencia`);
  }

  cerrarTicket(ticketId: string, mensaje: string): Observable<TicketAdminDto> {
    return this.http.post<TicketAdminDto>(`${this.base}/admin/tickets/${encodeURIComponent(ticketId)}/cerrar`, {
      mensaje,
    });
  }
}
