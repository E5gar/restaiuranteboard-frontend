import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stompClient: Client;
  private connectionSubject = new Subject<boolean>();

  constructor() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('https://restaiuranteboard-backend.onrender.com/ws-restaiurante'),
      reconnectDelay: 5000,
      debug: (str) => {
      }
    });

    this.stompClient.onConnect = (frame) => {
      this.connectionSubject.next(true);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
    };

    this.stompClient.activate();
  }

  subscribeToTopic(topic: string): Observable<string> {
    const subject = new Subject<string>();
    
    if (this.stompClient.connected) {
      this.stompClient.subscribe(topic, (message: Message) => {
        subject.next(message.body);
      });
    } else {
      this.connectionSubject.subscribe((connected) => {
        if (connected) {
          this.stompClient.subscribe(topic, (message: Message) => {
            subject.next(message.body);
          });
        }
      });
    }
    return subject.asObservable();
  }
}