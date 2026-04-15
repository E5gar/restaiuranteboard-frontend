import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setup-inicial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-inicial.component.html'
})
export class SetupInicialComponent {
  paso: number = 1;
  codigoVerificacion: string = '';
  cargando: boolean = false;
  
  modal = {
    visible: false,
    titulo: '',
    mensaje: '',
    esError: false,
    esExpirado: false // Nueva bandera para detectar expiración
  };

  config = {
    emailSmtp: '',
    passwordSmtp: '',
    nombreNegocio: '',
    logoBase64: '',
    telefonoNegocio: '',
    terminosCondiciones: ''
  };

  constructor(private configService: ConfigService, private router: Router) {}

  // --- VALIDACIONES DE INPUTS ---
  soloNumeros(event: any, longitudMax: number) {
    const input = event.target as HTMLInputElement;
    // Reemplaza cualquier cosa que no sea número
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length > longitudMax) {
      value = value.substring(0, longitudMax);
    }
    input.value = value;
    return value;
  }

  // --- MANEJO DE IMAGEN (HU-25) ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.abrirModal('Error de Archivo', 'El logo no debe pesar más de 5MB.', true);
        event.target.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.abrirModal('Formato Inválido', 'Solo se permite JPG o PNG.', true);
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.config.logoBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirModal(titulo: string, mensaje: string, esError: boolean = false) {
    const esExpirado = mensaje.toLowerCase().includes('expirado');
    this.modal = { visible: true, titulo, mensaje, esError, esExpirado };
  }

  cerrarModal() {
    if (this.modal.esExpirado) {
      this.modal.visible = false;
      this.enviarCodigo(); // Reenvía automáticamente
    } else {
      this.modal.visible = false;
      if (!this.modal.esError && this.paso === 1 && this.modal.titulo.includes('Enviado')) {
        this.paso = 2;
      }
    }
  }

  enviarCodigo() {
    if (!this.config.emailSmtp.endsWith('@gmail.com')) {
      this.abrirModal('Error', 'El correo debe ser @gmail.com', true);
      return;
    }
    this.cargando = true;
    this.configService.enviarVerificacion(this.config).subscribe({
      next: (res: any) => {
        this.cargando = false;
        this.abrirModal('¡Código Enviado!', res.message, false);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('Error', err.error?.message || 'Error de conexión', true);
      }
    });
  }

  finalizarConfiguracion() {
    this.cargando = true;
    const payload = { ...this.config, codigoVerificacion: this.codigoVerificacion };
    this.configService.validarYGuardar(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal('¡Éxito!', 'Restaurante configurado.', false);
        setTimeout(() => this.router.navigate(['/registro-admin']), 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('Error de Validación', err.error?.message || 'Código inválido', true);
      }
    });
  }
}