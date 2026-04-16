import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

@Component({
  selector: 'app-panel-caja',
  standalone: true,
  imports: [RouterModule, LogoutButtonComponent],
  templateUrl: './panel-caja.component.html',
  styleUrl: './panel-caja.css',
})
export class PanelCajaComponent {}
