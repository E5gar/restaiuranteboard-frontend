import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

type SlotEstado = 'VACIO' | 'CARGANDO' | 'ACTIVO';

interface IaSlot {
  slotNumber: number;
  titulo: string;
  status: SlotEstado;
  slotEnabled?: boolean;
  modelFileName?: string;
  encodersFileName?: string;
  rulesFileName?: string;
  frequencyFileName?: string;
  configFileName?: string;
  uploadedAt?: string;
}

@Component({
  selector: 'app-admin-modelos-ia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './admin-modelos-ia.component.html',
})
export class AdminModelosIaComponent implements OnInit {
  private readonly apiIa = 'https://restaiuranteboard-backend.onrender.com/api/ia-modelos';

  cargandoIa = false;
  guardandoIa = false;
  iaActiva = false;
  slotsIa: IaSlot[] = [];
  archivoModeloIa: File | null = null;
  archivoEncodersIa: File | null = null;
  archivoRulesSlot2: File | null = null;
  archivoFrequencySlot2: File | null = null;
  archivoConfigSlot2: File | null = null;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarConfiguracionIa();
  }

  cargarConfiguracionIa() {
    this.cargandoIa = true;
    this.http.get<any>(`${this.apiIa}`).subscribe({
      next: (resp) => {
        this.cargandoIa = false;
        this.iaActiva = !!resp?.iaActiva;
        this.slotsIa = Array.isArray(resp?.slots) ? resp.slots : [];
      },
      error: () => {
        this.cargandoIa = false;
        this.abrirModal('error', 'IA', 'No se pudo cargar la configuración de modelos IA.');
      },
    });
  }

  onArchivoModeloIaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.keras')) {
      this.abrirModal('error', 'Archivo inválido', 'Solo se permite archivo .keras para el modelo.');
      input.value = '';
      this.archivoModeloIa = null;
      return;
    }
    this.archivoModeloIa = file;
  }

  onArchivoEncodersIaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.abrirModal('error', 'Archivo inválido', 'Solo se permite archivo .json para encoders.');
      input.value = '';
      this.archivoEncodersIa = null;
      return;
    }
    this.archivoEncodersIa = file;
  }

  async guardarModeloIaSlot1() {
    if (!this.archivoModeloIa || !this.archivoEncodersIa) {
      this.abrirModal(
        'error',
        'Archivos requeridos',
        'Debes cargar el archivo .keras y el archivo .json.',
      );
      return;
    }
    this.guardandoIa = true;
    try {
      const modelFileBase64 = await this.fileToBase64(this.archivoModeloIa);
      const encodersFileBase64 = await this.fileToBase64(this.archivoEncodersIa);
      this.http
        .post<any>(`${this.apiIa}/slot-1/upload`, {
          modelFileName: this.archivoModeloIa.name,
          modelFileBase64,
          encodersFileName: this.archivoEncodersIa.name,
          encodersFileBase64,
        })
        .subscribe({
          next: (resp) => {
            this.guardandoIa = false;
            this.iaActiva = !!resp?.iaActiva;
            this.slotsIa = Array.isArray(resp?.slots) ? resp.slots : [];
            this.archivoModeloIa = null;
            this.archivoEncodersIa = null;
            this.abrirModal('exito', 'IA', 'Modelo y encoders cargados correctamente en Slot 1.');
          },
          error: (err) => {
            this.guardandoIa = false;
            this.abrirModal('error', 'IA', err?.error?.message || 'No se pudo cargar el modelo IA.');
          },
        });
    } catch {
      this.guardandoIa = false;
      this.abrirModal('error', 'IA', 'No se pudo procesar el archivo seleccionado.');
    }
  }

  actualizarSwitchIa() {
    this.guardandoIa = true;
    this.http.patch<any>(`${this.apiIa}/toggle`, { iaActiva: this.iaActiva }).subscribe({
      next: (resp) => {
        this.guardandoIa = false;
        this.iaActiva = !!resp?.iaActiva;
        this.slotsIa = Array.isArray(resp?.slots) ? resp.slots : [];
      },
      error: () => {
        this.guardandoIa = false;
        this.iaActiva = !this.iaActiva;
        this.abrirModal('error', 'IA', 'No se pudo actualizar el interruptor maestro de IA.');
      },
    });
  }

  actualizarSwitchSlot(slotNumber: number, enabled: boolean) {
    this.guardandoIa = true;
    this.http.patch<any>(`${this.apiIa}/slot/${slotNumber}/toggle`, { enabled }).subscribe({
      next: (resp) => {
        this.guardandoIa = false;
        this.iaActiva = !!resp?.iaActiva;
        this.slotsIa = Array.isArray(resp?.slots) ? resp.slots : [];
      },
      error: () => {
        this.guardandoIa = false;
        this.cargarConfiguracionIa();
        this.abrirModal('error', 'IA', 'No se pudo actualizar el interruptor del slot.');
      },
    });
  }

  onArchivoRulesSlot2Selected(event: Event) {
    this.archivoRulesSlot2 = this.validarJsonFile(event, 'rules.json');
  }

  onArchivoFrequencySlot2Selected(event: Event) {
    this.archivoFrequencySlot2 = this.validarJsonFile(event, 'frequency.json');
  }

  onArchivoConfigSlot2Selected(event: Event) {
    this.archivoConfigSlot2 = this.validarJsonFile(event, 'config.json');
  }

  async guardarPaqueteSlot2() {
    if (!this.archivoRulesSlot2 || !this.archivoFrequencySlot2 || !this.archivoConfigSlot2) {
      this.abrirModal(
        'error',
        'Archivos requeridos',
        'Debes cargar rules.json, frequency.json y config.json para el Slot 2.',
      );
      return;
    }
    this.guardandoIa = true;
    try {
      const rulesFileBase64 = await this.fileToBase64(this.archivoRulesSlot2);
      const frequencyFileBase64 = await this.fileToBase64(this.archivoFrequencySlot2);
      const configFileBase64 = await this.fileToBase64(this.archivoConfigSlot2);
      this.http
        .post<any>(`${this.apiIa}/slot-2/upload`, {
          rulesFileName: this.archivoRulesSlot2.name,
          rulesFileBase64,
          frequencyFileName: this.archivoFrequencySlot2.name,
          frequencyFileBase64,
          configFileName: this.archivoConfigSlot2.name,
          configFileBase64,
        })
        .subscribe({
          next: (resp) => {
            this.guardandoIa = false;
            this.iaActiva = !!resp?.iaActiva;
            this.slotsIa = Array.isArray(resp?.slots) ? resp.slots : [];
            this.archivoRulesSlot2 = null;
            this.archivoFrequencySlot2 = null;
            this.archivoConfigSlot2 = null;
            this.abrirModal('exito', 'Slot 2', 'Paquete de venta cruzada cargado correctamente.');
          },
          error: (err) => {
            this.guardandoIa = false;
            this.abrirModal('error', 'Slot 2', err?.error?.message || 'No se pudo cargar el paquete.');
          },
        });
    } catch {
      this.guardandoIa = false;
      this.abrirModal('error', 'Slot 2', 'No se pudo procesar el archivo seleccionado.');
    }
  }

  textoEstadoSlot(status: SlotEstado): string {
    if (status === 'ACTIVO') return 'ACTIVO';
    if (status === 'CARGANDO') return 'CARGANDO';
    return 'VACIO';
  }

  claseEstadoSlot(status: SlotEstado): string {
    if (status === 'ACTIVO') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/35 dark:text-emerald-200';
    }
    if (status === 'CARGANDO') {
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-200';
    }
    return 'border-gray-200 bg-gray-100 text-neutral-strong dark:border-dark-border dark:bg-slate-900 dark:text-dark-text-muted';
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }

  cerrarModal() {
    this.modal.visible = false;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer archivo.'));
      reader.readAsDataURL(file);
    });
  }

  private validarJsonFile(event: Event, esperado: string): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return null;
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.abrirModal('error', 'Archivo inválido', `El archivo ${esperado} debe ser .json.`);
      input.value = '';
      return null;
    }
    return file;
  }
}
