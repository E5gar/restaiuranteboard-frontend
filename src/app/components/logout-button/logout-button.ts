import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="cerrarSesion()"
      [ngClass]="
        variant === 'on-dark'
          ? 'border-white/40 bg-white/10 text-white hover:bg-white/20'
          : 'border-gray-300 bg-white text-secondary hover:bg-gray-50'
      "
      class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition"
    >
      <img src="/iconos/logout.png" alt="" width="16" height="16" class="h-4 w-4 object-contain" />
      Cerrar sesión
    </button>
  `,
})
export class LogoutButtonComponent {
  @Input() variant: 'on-dark' | 'on-light' = 'on-light';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  cerrarSesion(): void {
    this.auth.clearSession();
    void this.router.navigate(['/presentacion']);
  }
}
