import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

/** Placeholder hasta implementar el seguimiento real (HU futura). */
@Component({
  selector: 'app-seguimiento-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoutButtonComponent],
  template: `
    <div class="rb-page">
      <nav
        class="rb-nav flex flex-col gap-3 bg-primary px-4 py-3.5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <h1 class="rb-nav-title text-white">Seguimiento de pedido</h1>
        <app-logout-button variant="on-dark" />
      </nav>
      <div class="rb-container max-w-md text-center">
        <p class="text-neutral-strong dark:text-dark-text-muted">
          Esta sección estará disponible próximamente. Mientras tanto, revisa tu correo para actualizaciones.
        </p>
        <a routerLink="/menu" class="rb-btn-primary mt-6 inline-flex min-h-11 w-full justify-center sm:w-auto">Volver al menú</a>
      </div>
    </div>
  `,
})
export class SeguimientoPedidoComponent {}
