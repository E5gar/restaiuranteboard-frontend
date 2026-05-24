import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export type ChatMode = 'cliente' | 'admin';

export interface ChatUiMessage {
  sender: string;
  content: string;
  timestamp?: string;
}

export interface ChatSessionDto {
  sessionId: string;
  closed: boolean;
  userMessageCount: number;
  maxUserMessages: number;
  canContinue?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  messages: ChatUiMessage[];
}

export interface ChatSessionListItemDto {
  sessionId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  closed: boolean;
  userMessageCount: number;
  maxUserMessages: number;
  preview: string;
  canContinue: boolean;
}

export interface ChatSendResponseDto {
  sessionId: string;
  reply: string;
  closed: boolean;
  sessionExpired?: boolean;
  uiAction?: string;
  messages?: ChatUiMessage[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/chat';

  obtenerSesion(mode: ChatMode): Observable<ChatSessionDto> {
    return this.http.get<ChatSessionDto>(`${this.base}/${mode}/sesion`);
  }

  nuevaSesion(mode: ChatMode): Observable<ChatSessionDto> {
    return this.http.post<ChatSessionDto>(`${this.base}/${mode}/nueva-sesion`, {});
  }

  listarSesiones(mode: ChatMode): Observable<ChatSessionListItemDto[]> {
    return this.http.get<ChatSessionListItemDto[]>(`${this.base}/${mode}/sesiones`);
  }

  obtenerSesionPorId(mode: ChatMode, sessionId: string): Observable<ChatSessionDto> {
    return this.http.get<ChatSessionDto>(`${this.base}/${mode}/sesiones/${encodeURIComponent(sessionId)}`);
  }

  enviarMensaje(
    mode: ChatMode,
    sessionId: string | null,
    message: string,
  ): Observable<ChatSendResponseDto> {
    return this.http.post<ChatSendResponseDto>(`${this.base}/${mode}/mensaje`, {
      sessionId,
      message,
    });
  }
}
