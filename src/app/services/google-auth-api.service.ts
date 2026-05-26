import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export type GoogleAuthPayload = {
  idToken?: string;
  code?: string;
};

export type GoogleRegistrarPayload = {
  registrationToken?: string;
  idToken?: string;
  code?: string;
  fullName: string;
  dni: string;
  phone: string;
  address: string;
};

export type GoogleSesionRegistroResponse = {
  registrationToken: string;
  email: string;
  givenName: string;
  familyName: string;
};

@Injectable({ providedIn: 'root' })
export class GoogleAuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl + '/auth/google';

  login(payload: GoogleAuthPayload): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/login`, payload);
  }

  sesionRegistro(payload: GoogleAuthPayload): Observable<GoogleSesionRegistroResponse> {
    return this.http.post<GoogleSesionRegistroResponse>(`${this.base}/sesion-registro`, payload);
  }

  registrar(payload: GoogleRegistrarPayload): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/registrar`, payload);
  }
}
