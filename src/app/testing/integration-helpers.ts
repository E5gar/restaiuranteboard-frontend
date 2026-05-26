import { Component } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { HttpTestingController } from '@angular/common/http/testing';
import { environment } from '@env/environment';

@Component({ template: '' })
class IntegrationRouteStubComponent {}

export const integrationRoutes: Routes = [
  { path: 'menu', component: IntegrationRouteStubComponent },
  { path: 'gestion-administrador', component: IntegrationRouteStubComponent },
  { path: 'caja', component: IntegrationRouteStubComponent },
  { path: 'cocina', component: IntegrationRouteStubComponent },
  { path: 'entregas', component: IntegrationRouteStubComponent },
  { path: 'confirmar-cuenta', component: IntegrationRouteStubComponent },
  { path: 'retenido', component: IntegrationRouteStubComponent },
  { path: 'login', component: IntegrationRouteStubComponent },
  { path: 'checkout', component: IntegrationRouteStubComponent },
  { path: 'recuperar', component: IntegrationRouteStubComponent },
];

export function provideIntegrationRouter() {
  return provideRouter(integrationRoutes);
}

export function testJwt(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const payload = base64UrlEncode({ exp });
  return `${header}.${payload}.sig`;
}

export function flushCarritoRequest(httpMock: HttpTestingController, userId: string): void {
  const pending = httpMock.match(
    (r) => r.url === `${environment.apiUrl}/carrito` && r.params.get('userId') === userId,
  );
  pending.forEach((req) => req.flush({ items: [], removedItems: [] }));
}

export function flushAuthDarkModeRequest(httpMock: HttpTestingController): void {
  httpMock.match((r) => r.url.endsWith('/auth/dark-mode')).forEach((req) => {
    req.flush({ darkMode: false });
  });
}

export function flushMenuClienteExtras(httpMock: HttpTestingController, userId: string): void {
  flushCarritoRequest(httpMock, userId);
  httpMock.match(`${environment.apiUrl}/chat/cliente/sesion`).forEach((req) => {
    req.flush({
      sessionId: 'chat-1',
      closed: false,
      userMessageCount: 0,
      maxUserMessages: 10,
      messages: [],
    });
  });
  httpMock.match((r) => r.url.includes('/productos/menu/recomendaciones')).forEach((req) => {
    req.flush({
      highlightedProducts: [],
      showRecommendations: false,
      recommendationsTitle: 'Sugerencias para ti',
    });
  });
}

export function flushConfiguracionRequests(httpMock: HttpTestingController): void {
  httpMock.match(`${environment.apiUrl}/configuracion`).forEach((req) => {
    req.flush({
      configuracionCompleta: true,
      mediosPago: { yapeActivo: true, yapeTelefono: '912345678' },
    });
  });
}

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
