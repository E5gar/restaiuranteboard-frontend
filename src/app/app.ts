import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from './services/health.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>

    <div *ngIf="modalInvalidoVisible" class="rb-modal-backdrop">
      <div class="rb-modal max-w-sm">
        <div class="rb-modal-icon">
          <img src="/iconos/error-rojo.png" alt="Error" width="48" height="48" class="h-12 w-12 object-contain" />
        </div>
        <h3 class="mb-2 text-lg font-semibold text-gray-900">Entrada inválida</h3>
        <p class="mb-6 text-sm text-neutral-strong">Esta entrada no es válida</p>
        <button type="button" (click)="cerrarModalInvalido()" class="rb-btn-secondary">Aceptar</button>
      </div>
    </div>
  `,
})
export class App implements OnInit {
  statusData: any = null;
  modalInvalidoVisible = false;
  private ignorarSiguienteEvento = false;

  constructor(private healthService: HealthService) {}

  ngOnInit() {
    this.healthService.getStatus().subscribe({
      next: (data) => this.statusData = data,
      error: (err) => {
        console.error('Error conectando al backend:', err);
        this.statusData = { 
          postgresql: 'Error de conexión', 
          mongodb: 'Error de conexión', 
          backend_status: 'Offline' 
        };
      }
    });
  }

  @HostListener('document:input', ['$event'])
  onAnyInput(event: Event) {
    if (this.ignorarSiguienteEvento) {
      this.ignorarSiguienteEvento = false;
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
    if (!target.value) return;
    if (!/<script/i.test(target.value)) return;

    target.value = '';
    this.modalInvalidoVisible = true;
    this.ignorarSiguienteEvento = true;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  cerrarModalInvalido() {
    this.modalInvalidoVisible = false;
  }
}