import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  ChatService,
  type ChatMode,
  type ChatSessionListItemDto,
  type ChatUiMessage,
} from '../../services/chat.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @Input({ required: true }) mode!: ChatMode;

  private readonly chat = inject(ChatService);
  private readonly router = inject(Router);

  abierto = signal(false);
  vistaLista = signal(false);
  cargandoLista = signal(false);
  listaChats = signal<ChatSessionListItemDto[]>([]);
  sessionId = signal<string | null>(null);
  mensajes = signal<ChatUiMessage[]>([]);
  cerrada = signal(false);
  userMessageCount = signal(0);
  maxUserMessages = signal(3);
  procesando = signal(false);
  textoProcesando = signal('Procesando.');
  textoEntrada = '';
  mostrarBotonAtencion = signal(false);

  private procesandoTimer: ReturnType<typeof setInterval> | null = null;
  private procesandoPaso = 0;
  private readonly procesandoVariantes = [
    'Procesando.',
    'Procesando..',
    'Procesando...',
    'Procesando.',
  ];

  ngOnInit(): void {
    this.chat.obtenerSesion(this.mode).subscribe({
      next: (s) => this.aplicarSesion(s),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    this.detenerAnimacionProcesando();
  }

  togglePanel(): void {
    this.abierto.update((v) => !v);
    if (!this.abierto()) {
      this.vistaLista.set(false);
    }
  }

  iniciarNuevoChat(): void {
    this.vistaLista.set(false);
    this.chat.nuevaSesion(this.mode).subscribe({
      next: (s) => {
        this.aplicarSesion(s);
        this.cerrada.set(false);
      },
    });
  }

  abrirListaChats(): void {
    this.vistaLista.set(true);
    this.cargarListaChats();
  }

  volverAlChat(): void {
    this.vistaLista.set(false);
  }

  seleccionarChat(item: ChatSessionListItemDto): void {
    this.cargandoLista.set(true);
    this.chat
      .obtenerSesionPorId(this.mode, item.sessionId)
      .pipe(finalize(() => this.cargandoLista.set(false)))
      .subscribe({
        next: (s) => {
          this.aplicarSesion(s);
          this.vistaLista.set(false);
        },
        error: () => {},
      });
  }

  enviar(): void {
    const txt = (this.textoEntrada || '').trim();
    if (!txt || this.procesando() || this.cerrada()) {
      return;
    }
    this.mensajes.update((m) => [...m, { sender: 'USER', content: txt }]);
    this.textoEntrada = '';
    this.iniciarAnimacionProcesando();
    this.chat
      .enviarMensaje(this.mode, this.sessionId(), txt)
      .pipe(finalize(() => this.detenerAnimacionProcesando()))
      .subscribe({
        next: (r) => {
          this.sessionId.set(r.sessionId);
          if (r.messages && r.messages.length > 0) {
            this.mensajes.set(r.messages);
          } else if (r.reply) {
            this.mensajes.update((m) => [...m, { sender: 'ASSISTANT', content: r.reply }]);
          }
          this.cerrada.set(!!r.closed || !!r.sessionExpired);
          const userCount = (r.messages ?? this.mensajes()).filter((x) => x.sender === 'USER').length;
          this.userMessageCount.set(userCount);
          if (r.uiAction === 'ATENCION_CLIENTE') {
            this.mostrarBotonAtencion.set(true);
          }
        },
        error: () => {
          this.mensajes.update((m) => [
            ...m,
            { sender: 'ASSISTANT', content: 'No puedo realizar ello.' },
          ]);
        },
      });
  }

  abrirFormularioAtencion(): void {
    this.abierto.set(false);
    this.mostrarBotonAtencion.set(false);
    void this.router.navigate(['/atencion-cliente']);
  }

  tituloPanel(): string {
    return this.mode === 'admin' ? 'Consultor de negocio' : 'Asistente del menu';
  }

  tituloVista(): string {
    return this.vistaLista() ? 'Mis chats' : this.tituloPanel();
  }

  mensajesRestantes(): number {
    return Math.max(0, this.maxUserMessages() - this.userMessageCount());
  }

  formatoFechaLista(iso: string | null | undefined): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  estadoLista(item: ChatSessionListItemDto): string {
    if (item.canContinue) {
      return `${item.userMessageCount}/${item.maxUserMessages} mensajes`;
    }
    return 'Completado';
  }

  private cargarListaChats(): void {
    this.cargandoLista.set(true);
    this.chat
      .listarSesiones(this.mode)
      .pipe(finalize(() => this.cargandoLista.set(false)))
      .subscribe({
        next: (items) => this.listaChats.set(items ?? []),
        error: () => this.listaChats.set([]),
      });
  }

  private aplicarSesion(s: {
    sessionId: string;
    closed: boolean;
    userMessageCount: number;
    maxUserMessages: number;
    canContinue?: boolean;
    messages: ChatUiMessage[];
  }): void {
    this.sessionId.set(s.sessionId);
    const agotada = s.closed || s.userMessageCount >= (s.maxUserMessages ?? 3);
    this.cerrada.set(s.canContinue === false ? true : agotada);
    this.userMessageCount.set(s.userMessageCount);
    this.maxUserMessages.set(s.maxUserMessages ?? 3);
    this.mensajes.set(s.messages ?? []);
  }

  private iniciarAnimacionProcesando(): void {
    this.procesando.set(true);
    this.procesandoPaso = 0;
    this.textoProcesando.set(this.procesandoVariantes[0]);
    this.limpiarTimerProcesando();
    this.procesandoTimer = setInterval(() => {
      this.procesandoPaso = (this.procesandoPaso + 1) % this.procesandoVariantes.length;
      this.textoProcesando.set(this.procesandoVariantes[this.procesandoPaso]);
    }, 500);
  }

  private detenerAnimacionProcesando(): void {
    this.limpiarTimerProcesando();
    this.procesando.set(false);
  }

  private limpiarTimerProcesando(): void {
    if (this.procesandoTimer) {
      clearInterval(this.procesandoTimer);
      this.procesandoTimer = null;
    }
  }
}
