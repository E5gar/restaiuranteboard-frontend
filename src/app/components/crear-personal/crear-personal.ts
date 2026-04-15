import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-crear-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-personal.component.html'
})
export class CrearPersonalComponent {
  cargando = false;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };
  
  empleado = {
    role: '',
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(private http: HttpClient) {}

  soloNumeros(event: any, max: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > max) val = val.substring(0, max);
    input.value = val;
    return val;
  }

  seleccionarRol(rol: string) {
    this.empleado.role = rol;
  }

  crearCuenta() {
    if (!this.empleado.role) {
      this.abrirModal('error', 'Falta Rol', 'Por favor selecciona Cajero, Cocinero o Repartidor.');
      return;
    }
    if (!this.empleado.nombres || !this.empleado.apellidos || !this.empleado.dni || !this.empleado.email || !this.empleado.phone || !this.empleado.address) {
      this.abrirModal('error', 'Campos Vacíos', 'Todos los campos son obligatorios.');
      return;
    }
    if (this.empleado.dni.length !== 8) {
      this.abrirModal('error', 'DNI Inválido', 'El DNI debe tener 8 dígitos.');
      return;
    }
    if (this.empleado.phone.length !== 9 || !this.empleado.phone.startsWith('9')) {
      this.abrirModal('error', 'Teléfono Inválido', 'Debe empezar con 9 y tener 9 dígitos.');
      return;
    }

    this.cargando = true;
    const payload = {
      ...this.empleado,
      fullName: `${this.empleado.nombres} ${this.empleado.apellidos}`.trim()
    };

    this.http.post('http://localhost:8080/api/auth/crear-empleado', payload).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.abrirModal('exito', 'Personal Creado', res.message);
        this.empleado = { role: '', nombres: '', apellidos: '', dni: '', email: '', phone: '', address: '' };
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('error', 'Error al crear', err.error?.message || 'Error del servidor.');
      }
    });
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }
  cerrarModal() { this.modal.visible = false; }
}