import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

@Component({
  selector: 'app-panel-repartidor',
  standalone: true,
  imports: [RouterModule, LogoutButtonComponent],
  templateUrl: './panel-repartidor.component.html',
  styleUrl: './panel-repartidor.css',
})
export class PanelRepartidorComponent {}
