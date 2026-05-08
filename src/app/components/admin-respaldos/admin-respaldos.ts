import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);
  errorMsg = '';

  cargando = false;
  items: BackupPairItem[] = [];
  private pendingAction: null | (() => Promise<void>) = null;

  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  ngOnInit(): void {
    void this.refrescarTodo();
  }

  async refrescarTodo(): Promise<void> {
    this.setCargando(true);
    try {
      await this.recargarPares();
    } catch {
      this.abrirModal('error', 'Error', 'No se pudo cargar la lista de respaldos.');
    } finally {
      this.setCargando(false);
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
    this.setCargando(true);
    this.errorMsg = '';

    try {
      const pgKey = await this.generarDb('postgresql');
      const mgKey = await this.generarDb('mongodb');

      console.log('Esperando por:', { pgKey, mgKey });

      const inicio = Date.now();
      const timeoutMs = 80000;
      const intervaloMs = 5000;
      let encontrado = false;

      while (Date.now() - inicio < timeoutMs) {
        await this.sleep(intervaloMs);

        const [listPg, listMg] = await Promise.all([
          this.listar('postgresql'),
          this.listar('mongodb'),
        ]);

        const existePg = listPg.some((x) => x.key === pgKey);
        const existeMg = listMg.some((x) => x.key === mgKey);

        if (existePg && existeMg) {
          encontrado = true;
          break;
        }

        console.log(`Verificando... PG: ${existePg}, MG: ${existeMg}`);
      }

      if (encontrado) {
        await this.recargarPares();
        this.abrirModal(
          'ok',
          'Respaldo exitoso',
          'Los archivos de PostgreSQL y MongoDB se han verificado correctamente en Backblaze B2.',
        );
      } else {
        this.abrirModal(
          'error',
          'Tiempo excedido',
          'El proceso de GitHub Actions está tardando más de lo esperado. Por favor, actualiza la lista manualmente en unos momentos.',
        );
      }
    } catch (e) {
      console.error('Error en proceso de backup:', e);
      this.abrirModal(
        'error',
        'Error de comunicación',
        'No se pudo conectar con el servidor para iniciar el respaldo.',
      );
    } finally {
      this.setCargando(false);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generarDb(db: DbKind): Promise<string> {
    const params = new HttpParams().set('db', db);
    return new Promise((resolve, reject) => {
      this.http
        .post<{ ok: boolean; item?: BackupItem }>(`${API}/generate`, null, { params })
        .subscribe({
          next: (res) => {
            if (res?.item?.key) {
              resolve(res.item.key);
            } else {
              reject(new Error(`El servidor no devolvió una clave para ${db}`));
            }
          },
          error: (e) => reject(e),
        });
    });
  }

  restaurar(item: BackupPairItem): void {
    this.abrirConfirmacion(
      'Restaurar backup',
      '¿Deseas restaurar este backup conjunto? Esto reemplazará los datos actuales.',
      async () => {
        await this.restaurarConfirmado(item);
      },
    );
  }

  private async restaurarConfirmado(item: BackupPairItem): Promise<void> {
    this.setCargando(true);
    try {
      await Promise.all([
        this.restaurarDb('postgresql', item.postgresKey),
        this.restaurarDb('mongodb', item.mongoKey),
      ]);
      this.abrirModal(
        'ok',
        'Restauración iniciada',
        'Se inició la restauración conjunta de PostgreSQL y MongoDB.',
      );
    } catch (e) {
      this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo restaurar el backup conjunto.');
    } finally {
      this.setCargando(false);
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

  eliminar(item: BackupPairItem): void {
    this.abrirConfirmacion(
      'Eliminar backup',
      '¿Deseas eliminar este backup conjunto?',
      async () => {
        await this.eliminarConfirmado(item);
      },
    );
  }

  private async eliminarConfirmado(item: BackupPairItem): Promise<void> {
    this.setCargando(true);
    try {
      await Promise.all([this.eliminarDb(item.postgresKey), this.eliminarDb(item.mongoKey)]);
      await this.refrescarTodo();
      this.abrirModal('ok', 'Eliminado', 'El backup conjunto fue eliminado.');
    } catch (e) {
      this.abrirModal('error', 'Error', this.msg(e) || 'No se pudo eliminar el backup conjunto.');
    } finally {
      this.setCargando(false);
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
    this.pendingAction = null;
    this.cdr.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.modal.visible = false;
    this.pendingAction = null;
    this.cdr.detectChanges();
  }

  async confirmarModal(): Promise<void> {
    if (!this.pendingAction || this.cargando) return;
    const action = this.pendingAction;
    this.pendingAction = null;
    this.modal.visible = false;
    this.cdr.detectChanges();
    await action();
  }

  private abrirModal(tipo: 'ok' | 'error' | 'info', titulo: string, mensaje: string): void {
    this.modal = { visible: true, tipo, titulo, mensaje };
    this.pendingAction = null;
    this.cdr.detectChanges();
  }

  private abrirConfirmacion(titulo: string, mensaje: string, action: () => Promise<void>): void {
    this.pendingAction = action;
    this.modal = { visible: true, tipo: 'confirm', titulo, mensaje };
    this.cdr.detectChanges();
  }

  private msg(e: any): string {
    return e?.error?.message || e?.error?.error || e?.message || '';
  }

  private async recargarPares(): Promise<void> {
    const [itemsPg, itemsMg] = await Promise.all([
      this.listar('postgresql'),
      this.listar('mongodb'),
    ]);
    this.items = this.unirPares(itemsPg, itemsMg);
  }

  private async esperarBackups(
    pgKey: string,
    mgKey: string,
    timeoutMs: number,
    intervalMs: number,
  ): Promise<boolean> {
    const inicio = Date.now();
    while (Date.now() - inicio <= timeoutMs) {
      try {
        await this.recargarPares();
        const existe = this.items.some((x) => x.postgresKey === pgKey && x.mongoKey === mgKey);
        if (existe) {
          return true;
        }
      } catch {}
      await this.sleep(intervalMs);
    }
    return false;
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

  private setCargando(on: boolean): void {
    this.cargando = on;
    this.cdr.detectChanges();
  }
}
