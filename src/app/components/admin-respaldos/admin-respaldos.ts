import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { environment } from '@env/environment';

const API = environment.apiUrl + '/admin/backups';

type DbKind = 'postgresql' | 'mongodb';

interface BackupItem {
  key: string;
  sizeBytes: number;
  lastModified: string | null;
}

@Component({
  selector: 'app-admin-respaldos',
  standalone: true,
  imports: [CommonModule, RouterModule, LogoutButtonComponent],
  templateUrl: './admin-respaldos.component.html',
})
export class AdminRespaldosComponent implements OnInit {
  private readonly http = inject(HttpClient);

  cargandoPg = false;
  cargandoMg = false;

  itemsPg: BackupItem[] = [];
  itemsMg: BackupItem[] = [];

  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  ngOnInit(): void {
    void this.refrescarTodo();
  }

  async refrescarTodo(): Promise<void> {
    await Promise.all([this.cargarLista('postgresql'), this.cargarLista('mongodb')]);
  }

  cargarLista(db: DbKind): Promise<void> {
    this.setLoading(db, true);
    const params = new HttpParams().set('db', db);
    return new Promise((resolve) => {
      this.http.get<BackupItem[]>(`${API}/list`, { params }).subscribe({
        next: (rows) => {
          if (db === 'postgresql') this.itemsPg = rows ?? [];
          else this.itemsMg = rows ?? [];
          this.setLoading(db, false);
          resolve();
        },
        error: () => {
          this.setLoading(db, false);
          this.abrirModal('error', 'Error', 'No se pudo cargar la lista de respaldos.');
          resolve();
        },
      });
    });
  }

  generar(db: DbKind): void {
    this.setLoading(db, true);
    const params = new HttpParams().set('db', db);
    this.http.post<{ ok: boolean; item?: BackupItem }>(`${API}/generate`, null, { params }).subscribe({
      next: () => {
        this.setLoading(db, false);
        void this.cargarLista(db);
        this.abrirModal('ok', 'Respaldo generado', 'El backup se subió correctamente.');
      },
      error: (e) => {
        this.setLoading(db, false);
        this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo generar el backup.');
      },
    });
  }

  restaurar(db: DbKind, key: string): void {
    if (!key) return;
    if (!confirm('¿Deseas restaurar este backup? Esto reemplazará los datos actuales.')) return;
    this.setLoading(db, true);
    const params = new HttpParams().set('db', db).set('key', key);
    this.http.post<{ ok: boolean }>(`${API}/restore`, null, { params }).subscribe({
      next: () => {
        this.setLoading(db, false);
        this.abrirModal('ok', 'Restauración completa', 'La base de datos fue restaurada.');
      },
      error: (e) => {
        this.setLoading(db, false);
        this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo restaurar el backup.');
      },
    });
  }

  eliminar(db: DbKind, key: string): void {
    if (!key) return;
    if (!confirm('¿Deseas eliminar este backup?')) return;
    this.setLoading(db, true);
    const params = new HttpParams().set('key', key);
    this.http.delete<{ ok: boolean }>(`${API}/delete`, { params }).subscribe({
      next: () => {
        this.setLoading(db, false);
        void this.cargarLista(db);
        this.abrirModal('ok', 'Eliminado', 'El backup fue eliminado.');
      },
      error: (e) => {
        this.setLoading(db, false);
        this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo eliminar el backup.');
      },
    });
  }

  cerrarModal(): void {
    this.modal.visible = false;
  }

  private abrirModal(tipo: 'ok' | 'error' | 'info', titulo: string, mensaje: string): void {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }

  private setLoading(db: DbKind, on: boolean): void {
    if (db === 'postgresql') this.cargandoPg = on;
    else this.cargandoMg = on;
  }

  private msg(e: any): string {
    return e?.error?.message || e?.error?.error || e?.message || '';
  }

  formatBytes(n: number): string {
    const v = Number(n || 0);
    if (v < 1024) return `${v} B`;
    const kb = v / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }
}

