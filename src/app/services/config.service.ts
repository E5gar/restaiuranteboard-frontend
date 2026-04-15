import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private apiUrl = 'http://localhost:8080/api/configuracion';

  constructor(private http: HttpClient) {}

  enviarVerificacion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-verificacion`, data);
  }

  validarYGuardar(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/validar-y-guardar`, data);
  }
}
