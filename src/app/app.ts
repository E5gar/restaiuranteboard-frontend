import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthService } from './services/health.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet> 
  `
})
export class App implements OnInit {
  statusData: any = null;

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
}