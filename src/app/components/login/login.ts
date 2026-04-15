import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  verPass = false;
  cargando = false;

  modal = { visible: false, titulo: '', mensaje: '', esError: false };

  constructor(private http: HttpClient, private router: Router) {}

  validarDominio(email: string): boolean {
    const dominiosValidos = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];
    const dominio = email.split('@')[1];
    return dominiosValidos.includes(dominio);
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.abrirModal('Campos Vacíos', 'Por favor ingresa tus credenciales.', true);
      return;
    }

    if (!this.validarDominio(this.email)) {
      this.abrirModal('Correo Inválido', 'Solo se permiten correos personales (Gmail, Outlook, etc.)', true);
      return;
    }

    this.cargando = true;
    this.http.post('http://localhost:8080/api/auth/login', { email: this.email, password: this.password })
      .subscribe({
        next: (user: any) => {
          this.cargando = false;
          
          if (user.firstLogin) {
            // HU-21: Empleado nuevo entra aquí, pasamos el email por query params
            this.router.navigate(['/confirmar-cuenta'], { queryParams: { email: user.email } });
            return;
          }

          switch(user.role) {
            case 'ADMIN': this.router.navigate(['/gestion-administrador']); break; // ACTUALIZADO
            case 'CLIENTE': this.router.navigate(['/menu']); break;
            case 'CAJERO': this.router.navigate(['/caja']); break;
            case 'COCINERO': this.router.navigate(['/cocina']); break;
            case 'REPARTIDOR': this.router.navigate(['/entregas']); break;
          }
        },
        
        error: (err) => {
          this.cargando = false;
          this.abrirModal('Acceso Denegado', err.error?.message || 'Credenciales inválidas', true);
        }
      });
  }

  abrirModal(titulo: string, mensaje: string, esError: boolean) {
    this.modal = { visible: true, titulo, mensaje, esError };
  }
}