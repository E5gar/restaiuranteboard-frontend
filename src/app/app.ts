import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from './services/health.service';
import { RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ThemeToggleComponent],
  template: `
    <router-outlet></router-outlet>
    <app-theme-toggle />
    <div *ngIf="entradaInvalidaModal" class="rb-modal-backdrop">
      <div class="rb-modal max-w-sm border-gray-200 dark:border-dark-border">
        <div class="rb-modal-icon !mb-6">
          <img
            src="/iconos/advertencia-amarillo.png"
            alt="Advertencia"
            width="48"
            height="48"
            class="h-12 w-12 object-contain"
          />
        </div>
        <h3 class="mb-8 text-lg font-semibold text-gray-900 sm:text-xl dark:text-dark-text-strong">
          Esta entrada no es válida
        </h3>
        <div class="flex justify-center">
          <button type="button" (click)="cerrarEntradaInvalida()" class="rb-btn-secondary">Aceptar</button>
        </div>
      </div>
    </div>
  `,
})
export class App implements OnInit, OnDestroy {
  statusData: any = null;
  entradaInvalidaModal = false;

  private readonly patroScript = /script/i;

  private readonly onDocumentInput = (event: Event) => this.validarEntradaGlobal(event);

  constructor(private healthService: HealthService) {}

  ngOnInit() {
    document.addEventListener('input', this.onDocumentInput, true);
    this.healthService.getStatus().subscribe({
      next: (data) => (this.statusData = data),
      error: (err) => {
        console.error('Error conectando al backend:', err);
        this.statusData = {
          postgresql: 'Error de conexión',
          mongodb: 'Error de conexión',
          backend_status: 'Offline',
        };
      },
    });
  }

  ngOnDestroy() {
    document.removeEventListener('input', this.onDocumentInput, true);
  }

  cerrarEntradaInvalida() {
    this.entradaInvalidaModal = false;
  }

  private validarEntradaGlobal(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
    const el = target as HTMLInputElement | HTMLTextAreaElement;
    if (!this.esCampoTexto(el)) return;
    const v = el.value ?? '';
    if (!this.patroScript.test(v)) return;
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    this.entradaInvalidaModal = true;
  }

  private esCampoTexto(el: HTMLInputElement | HTMLTextAreaElement): boolean {
    if (el instanceof HTMLTextAreaElement) return true;
    const t = (el.type || 'text').toLowerCase();
    const excluidos = new Set([
      'checkbox',
      'radio',
      'file',
      'hidden',
      'button',
      'submit',
      'image',
      'range',
      'color',
      'reset',
    ]);
    return !excluidos.has(t);
  }
}