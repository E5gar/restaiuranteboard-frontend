import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { environment } from '@env/environment'; 
import {
  bloquearTeclasNoNumericas,
  errorDni8,
  errorEmailHistoriaUsuario,
  errorTelefono9,
  filtrarSoloDigitos,
  filtrarSoloLetrasYEspacios,
} from '../../utils/form-validators';

@Component({
  selector: 'app-crear-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './crear-personal.component.html',
})
export class CrearPersonalComponent implements OnInit {
  cargando = false;
  cargandoPersonal = false;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  empleado = {
    role: '',
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    phone: '',
    address: '',
  };

  personalActivos: Array<{ userId: string; fullName: string; role: string; email: string }> = [];
  empleadoAEliminar: { userId: string; fullName: string; role: string; email: string } | null = null;
  modalEliminarEmpleado = {
    visible: false,
    tipo: 'advertencia',
    titulo: 'Eliminar empleado',
    mensaje:
      'Esta acción dará de baja al empleado de forma permanente. No podrá volver a iniciar sesión, pero se conservará su nombre en los registros históricos de ventas y entregas para auditoría',
  };
  eliminandoEmpleado = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPersonalActivos();
  }

  soloNumeros(event: Event, max: number) {
    return filtrarSoloDigitos(event, max);
  }

  soloLetras(event: Event, max?: number) {
    return filtrarSoloLetrasYEspacios(event, max);
  }

  bloquearNoNumerico(event: KeyboardEvent) {
    bloquearTeclasNoNumericas(event);
  }

  seleccionarRol(rol: string) {
    this.empleado.role = rol;
  }

  cargarPersonalActivos(): void {
    this.cargandoPersonal = true;
    this.http
      .get<Array<{ userId: string; fullName: string; role: string; email: string }>>(environment.apiUrl + '/admin/personal/activos')
      .subscribe({
        next: (res) => {
          this.cargandoPersonal = false;
          this.personalActivos = Array.isArray(res) ? res : [];
        },
        error: (err) => {
          this.cargandoPersonal = false;
          const msg = err.error?.message || 'No se pudo cargar el personal.';
          this.abrirModal('error', 'Personal', msg);
        },
      });
  }

  crearCuenta() {
    if (!this.empleado.role) {
      this.abrirModal('error', 'Falta Rol', 'Por favor selecciona Cajero, Cocinero o Repartidor.');
      return;
    }
    if (
      !this.empleado.nombres ||
      !this.empleado.apellidos ||
      !this.empleado.dni ||
      !this.empleado.email ||
      !this.empleado.phone ||
      !this.empleado.address
    ) {
      this.abrirModal('error', 'Campos Vacíos', 'Todos los campos son obligatorios.');
      return;
    }
    const dniErr = errorDni8(this.empleado.dni);
    if (dniErr) {
      this.abrirModal('error', 'DNI Inválido', dniErr);
      return;
    }
    const telErr = errorTelefono9(this.empleado.phone);
    if (telErr) {
      this.abrirModal('error', 'Teléfono Inválido', telErr);
      return;
    }
    const emailErr = errorEmailHistoriaUsuario(this.empleado.email);
    if (emailErr) {
      this.abrirModal('error', 'Correo Inválido', emailErr);
      return;
    }

    this.cargando = true;
    const payload = {
      ...this.empleado,
      fullName: `${this.empleado.nombres} ${this.empleado.apellidos}`.trim(),
    };

    this.http
      .post(environment.apiUrl + '/auth/crear-empleado', payload)
      .subscribe({
        next: (res: any) => {
          this.cargando = false;
          this.abrirModal('exito', 'Personal Creado', res.message);
          this.empleado = {
            role: '',
            nombres: '',
            apellidos: '',
            dni: '',
            email: '',
            phone: '',
            address: '',
          };
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error?.message || 'Error del servidor.';
          const duplicado = String(msg).includes('Ya existe');
          this.abrirModal(duplicado ? 'advertencia' : 'error', duplicado ? 'Datos duplicados' : 'Error al crear', msg);
        },
      });
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }
  cerrarModal() {
    this.modal.visible = false;
  }

  abrirModalEliminarEmpleado(emp: { userId: string; fullName: string; role: string; email: string }): void {
    this.empleadoAEliminar = emp;
    this.modalEliminarEmpleado.visible = true;
  }

  cerrarModalEliminarEmpleado(): void {
    if (this.eliminandoEmpleado) return;
    this.modalEliminarEmpleado.visible = false;
    this.empleadoAEliminar = null;
  }

  confirmarEliminarEmpleado(): void {
    if (!this.empleadoAEliminar) return;
    this.eliminandoEmpleado = true;
    const id = this.empleadoAEliminar.userId;
    this.http.post<{ message: string }>(environment.apiUrl + `/admin/personal/${id}/eliminar`, {}).subscribe({
      next: (res) => {
        this.eliminandoEmpleado = false;
        this.modalEliminarEmpleado.visible = false;
        this.empleadoAEliminar = null;
        this.abrirModal('exito', 'Empleado dado de baja', res?.message || 'Empleado eliminado.');
        this.cargarPersonalActivos();
      },
      error: (err) => {
        this.eliminandoEmpleado = false;
        const msg = err.error?.message || 'No se pudo eliminar el empleado.';
        this.abrirModal('advertencia', 'No se pudo eliminar', msg);
      },
    });
  }
}
