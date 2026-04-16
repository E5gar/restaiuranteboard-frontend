import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

@Component({
  selector: 'app-panel-cocina',
  standalone: true,
  imports: [RouterModule, LogoutButtonComponent],
  templateUrl: './panel-cocina.component.html',
  styleUrl: './panel-cocina.css',
})
export class PanelCocinaComponent {}
