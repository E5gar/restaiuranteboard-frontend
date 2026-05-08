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

interface BackupPairItem {
  pairId: string;
  postgresKey: string;
  mongoKey: string;
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

  cargando = false;
  items: BackupPairItem[] = [];

  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  ngOnInit(): void {
    void this.refrescarTodo();
  }

  async refrescarTodo(): Promise<void> {
    this.cargando = true;
    try {
      const [itemsPg, itemsMg] = await Promise.all([this.listar('postgresql'), this.listar('mongodb')]);
      this.items = this.unirPares(itemsPg, itemsMg);
    } catch {
      this.abrirModal('error', 'Error', 'No se pudo cargar la lista de respaldos.');
    } finally {
      this.cargando = false;
    }
  }

  private listar(db: DbKind): Promise<BackupItem[]> {
    const params = new HttpParams().set('db', db);
    return new Promise((resolve, reject) => {
      this.http.get<BackupItem[]>(`${API}/list`, { params }).subscribe({
        next: (rows) => resolve(rows ?? []),
        error: () => reject(),
      });
    });
  }

  async generar(): Promise<void> {
    this.cargando = true;
    try {
      await Promise.all([this.generarDb('postgresql'), this.generarDb('mongodb')]);
      await this.refrescarTodo();
      this.abrirModal('ok', 'Respaldo generado', 'Los backups de PostgreSQL y MongoDB se generaron correctamente.');
    } catch (e) {
      this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo generar el backup conjunto.');
      this.cargando = false;
    }
  }

  private generarDb(db: DbKind): Promise<void> {
    const params = new HttpParams().set('db', db);
    return new Promise((resolve, reject) => {
      this.http.post<{ ok: boolean; item?: BackupItem }>(`${API}/generate`, null, { params }).subscribe({
        next: () => resolve(),
        error: (e) => reject(e),
      });
    });
  }

  async restaurar(item: BackupPairItem): Promise<void> {
    if (!confirm('¿Deseas restaurar este backup conjunto? Esto reemplazará los datos actuales.')) return;
    this.cargando = true;
    try {
      await Promise.all([
        this.restaurarDb('postgresql', item.postgresKey),
        this.restaurarDb('mongodb', item.mongoKey),
      ]);
      this.abrirModal('ok', 'Restauración iniciada', 'Se inició la restauración conjunta de PostgreSQL y MongoDB.');
    } catch (e) {
      this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo restaurar el backup conjunto.');
    } finally {
      this.cargando = false;
    }
  }

  private restaurarDb(db: DbKind, key: string): Promise<void> {
    const params = new HttpParams().set('db', db).set('key', key);
    return new Promise((resolve, reject) => {
      this.http.post<{ ok: boolean }>(`${API}/restore`, null, { params }).subscribe({
        next: () => resolve(),
        error: (e) => reject(e),
      });
    });
  }

  async eliminar(item: BackupPairItem): Promise<void> {
    if (!confirm('¿Deseas eliminar este backup conjunto?')) return;
    this.cargando = true;
    try {
      await Promise.all([this.eliminarDb(item.postgresKey), this.eliminarDb(item.mongoKey)]);
      await this.refrescarTodo();
      this.abrirModal('ok', 'Eliminado', 'El backup conjunto fue eliminado.');
    } catch (e) {
      this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo eliminar el backup conjunto.');
      this.cargando = false;
    }
  }

  private eliminarDb(key: string): Promise<void> {
    const params = new HttpParams().set('key', key);
    return new Promise((resolve, reject) => {
      this.http.delete<{ ok: boolean }>(`${API}/delete`, { params }).subscribe({
        next: () => resolve(),
        error: (e) => reject(e),
      });
    });
  }

  cerrarModal(): void {
    this.modal.visible = false;
  }

  private abrirModal(tipo: 'ok' | 'error' | 'info', titulo: string, mensaje: string): void {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }

  private msg(e: any): string {
    return e?.error?.message || e?.error?.error || e?.message || '';
  }

  private unirPares(pg: BackupItem[], mg: BackupItem[]): BackupPairItem[] {
    const mgById = new Map<string, BackupItem>();
    for (const item of mg) {
      const id = this.extraerPairId(item.key);
      if (!id) continue;
      mgById.set(id, item);
    }
    const out: BackupPairItem[] = [];
    for (const p of pg) {
      const id = this.extraerPairId(p.key);
      if (!id) continue;
      const m = mgById.get(id);
      if (!m) continue;
      out.push({
        pairId: id,
        postgresKey: p.key,
        mongoKey: m.key,
        sizeBytes: Number(p.sizeBytes || 0) + Number(m.sizeBytes || 0),
        lastModified: this.maxDate(p.lastModified, m.lastModified),
      });
    }
    out.sort((a, b) => this.sortDateDesc(a.lastModified, b.lastModified));
    return out;
  }

  private extraerPairId(key: string): string | null {
    const m = key?.match(/^backup_(postgresql|mongodb)_(\d{8}_\d{4})/i);
    return m?.[2] ?? null;
  }

  private maxDate(a: string | null, b: string | null): string | null {
    if (!a) return b ?? null;
    if (!b) return a;
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return da >= db ? a : b;
  }

  private sortDateDesc(a: string | null, b: string | null): number {
    const ta = a ? new Date(a).getTime() : 0;
    const tb = b ? new Date(b).getTime() : 0;
    return tb - ta;
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

