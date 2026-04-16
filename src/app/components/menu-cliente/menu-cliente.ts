import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

@Component({
  selector: 'app-menu-cliente',
  standalone: true,
  imports: [RouterModule, LogoutButtonComponent],
  templateUrl: './menu-cliente.component.html',
  styleUrl: './menu-cliente.css',
})
export class MenuClienteComponent {}
