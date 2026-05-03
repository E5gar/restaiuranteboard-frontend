import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { LogoutButtonComponent } from '../logout-button/logout-button';
import { ThemeService } from '../../services/theme.service';

const API = 'https://restaiuranteboard-backend.onrender.com/api/admin/dashboard';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly theme = inject(ThemeService);

  readonly tabs: { id: string; label: string; icon: string }[] = [
    { id: 'ventas', label: 'Ventas y Pedidos', icon: '/iconos/billetes-soles.png' },
    { id: 'inventario', label: 'Inventario y Costos', icon: '/iconos/categoria-verduras.png' },
    { id: 'productos', label: 'Productos', icon: '/iconos/categoria-plato-principal.png' },
    { id: 'clientes', label: 'Clientes', icon: '/iconos/categoria-entrada.png' },
    { id: 'operacion', label: 'Operación', icon: '/iconos/camion-abastecer-ingrediente.png' },
    { id: 'seguridad', label: 'Seguridad', icon: '/iconos/candado.png' },
    { id: 'interacciones', label: 'Interacciones', icon: '/iconos/destellos-recomendaciones.png' },
  ];

  pestana = 'ventas';
  cargando = false;
  errorMsg = '';

  fromDate = '';
  toDate = '';

  filtroEstado = '';
  filtroMomento = '';
  filtroDiaSemana = '';
  filtroClima = '';

  filtroCatInsumo = '';
  filtroMovTipo = '';
  soloStockBajo = false;
  umbralStock = 10;

  filtroCatProducto = '';
  filtroEstrellasMin: number | null = null;
  precioMin: number | null = null;
  precioMax: number | null = null;

  regDesde = '';
  regHasta = '';
  soloRecurrentes = false;

  filtroLoginStatus = '';
  filtroRolLogin = '';

  filtroAccionIx = '';
  filtroClimaIx = '';
  filtroSegmentoIx = '';
  filtroUserIx = '';

  ventas: any = null;
  inventario: any = null;
  productos: any = null;
  clientes: any = null;
  operacion: any = null;
  seguridad: any = null;
  interacciones: any = null;

  private charts = new Map<string, Chart>();

  diasSemanaLabel = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly horasDia = Array.from({ length: 24 }, (_, i) => i);

  ngOnInit(): void {
    void this.cargarActual();
  }

  ngOnDestroy(): void {
    this.destroyAllCharts();
  }

  constructor() {
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hace30.getDate() - 30);
    this.toDate = this.toYmd(hoy);
    this.fromDate = this.toYmd(hace30);
  }

  cambiarPestana(id: string): void {
    this.pestana = id;
    this.errorMsg = '';
    void this.cargarActual();
  }

  aplicarFiltros(): void {
    void this.cargarActual();
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private exclusiveToIso(endYmd: string): string {
    const [y, m, d] = endYmd.split('-').map((x) => parseInt(x, 10));
    const next = new Date(y, m - 1, d + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}T00:00:00`;
  }

  private baseParams(): HttpParams {
    let p = new HttpParams()
      .set('from', `${this.fromDate}T00:00:00`)
      .set('to', this.exclusiveToIso(this.toDate));
    return p;
  }

  async cargarActual(): Promise<void> {
    this.cargando = true;
    this.errorMsg = '';
    try {
      if (this.pestana === 'ventas') await this.cargarVentas();
      else if (this.pestana === 'inventario') await this.cargarInventario();
      else if (this.pestana === 'productos') await this.cargarProductos();
      else if (this.pestana === 'clientes') await this.cargarClientes();
      else if (this.pestana === 'operacion') await this.cargarOperacion();
      else if (this.pestana === 'seguridad') await this.cargarSeguridad();
      else if (this.pestana === 'interacciones') await this.cargarInteracciones();
    } catch {
      this.errorMsg = 'No se pudo cargar el panel. Revisa la conexión o vuelve a iniciar sesión.';
    } finally {
      this.cargando = false;
    }
  }

  private cargarVentas(): Promise<void> {
    let p = this.baseParams();
    if (this.filtroEstado) p = p.set('status', this.filtroEstado);
    if (this.filtroMomento) p = p.set('momentOfDay', this.filtroMomento);
    if (this.filtroDiaSemana) p = p.set('dayOfWeek', this.filtroDiaSemana);
    if (this.filtroClima) p = p.set('weatherCondition', this.filtroClima);
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/ventas-pedidos`, { params: p }).subscribe({
        next: (d) => {
          this.ventas = d;
          setTimeout(() => this.renderVentasCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarInventario(): Promise<void> {
    let p = this.baseParams();
    if (this.filtroCatInsumo) p = p.set('categoriaInsumo', this.filtroCatInsumo);
    if (this.filtroMovTipo) p = p.set('tipoMovimiento', this.filtroMovTipo);
    p = p.set('soloStockBajo', String(this.soloStockBajo));
    p = p.set('umbralStockBajo', String(this.umbralStock));
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/inventario-costos`, { params: p }).subscribe({
        next: (d) => {
          this.inventario = d;
          setTimeout(() => this.renderInventarioCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarProductos(): Promise<void> {
    let p = this.baseParams();
    if (this.filtroCatProducto) p = p.set('categoriaProducto', this.filtroCatProducto);
    if (this.filtroEstrellasMin != null) p = p.set('estrellasMin', String(this.filtroEstrellasMin));
    if (this.precioMin != null) p = p.set('precioMin', String(this.precioMin));
    if (this.precioMax != null) p = p.set('precioMax', String(this.precioMax));
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/productos`, { params: p }).subscribe({
        next: (d) => {
          this.productos = d;
          setTimeout(() => this.renderProductosCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarClientes(): Promise<void> {
    let p = this.baseParams();
    if (this.regDesde) p = p.set('regFrom', `${this.regDesde}T00:00:00`);
    if (this.regHasta) p = p.set('regTo', this.exclusiveToIso(this.regHasta));
    if (this.soloRecurrentes) p = p.set('soloRecurrentes', 'true');
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/clientes`, { params: p }).subscribe({
        next: (d) => {
          this.clientes = d;
          setTimeout(() => this.renderClientesCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarOperacion(): Promise<void> {
    const p = this.baseParams();
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/operacion`, { params: p }).subscribe({
        next: (d) => {
          this.operacion = d;
          setTimeout(() => this.renderOperacionCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarSeguridad(): Promise<void> {
    let p = this.baseParams();
    if (this.filtroLoginStatus) p = p.set('status', this.filtroLoginStatus);
    if (this.filtroRolLogin) p = p.set('rol', this.filtroRolLogin);
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/seguridad`, { params: p }).subscribe({
        next: (d) => {
          this.seguridad = d;
          setTimeout(() => this.renderSeguridadCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private cargarInteracciones(): Promise<void> {
    let p = this.baseParams();
    if (this.filtroAccionIx) p = p.set('action', this.filtroAccionIx);
    if (this.filtroClimaIx) p = p.set('condicionClima', this.filtroClimaIx);
    if (this.filtroSegmentoIx) p = p.set('segmento', this.filtroSegmentoIx);
    if (this.filtroUserIx) p = p.set('userId', this.filtroUserIx);
    return new Promise((resolve, reject) => {
      this.http.get(`${API}/interacciones`, { params: p }).subscribe({
        next: (d) => {
          this.interacciones = d;
          setTimeout(() => this.renderInteraccionesCharts(), 0);
          resolve();
        },
        error: () => reject(),
      });
    });
  }

  private tc() {
    const dark = this.theme.isDark();
    return {
      text: dark ? '#e2e8f0' : '#1f2937',
      grid: dark ? '#334155' : '#e5e7eb',
      subtle: dark ? '#64748b' : '#9ca3af',
    };
  }

  private destroyPrefix(prefix: string): void {
    for (const k of [...this.charts.keys()]) {
      if (k.startsWith(prefix)) {
        this.charts.get(k)?.destroy();
        this.charts.delete(k);
      }
    }
  }

  private destroyAllCharts(): void {
    for (const c of this.charts.values()) c.destroy();
    this.charts.clear();
  }

  private renderVentasCharts(): void {
    if (!this.ventas) return;
    this.destroyPrefix('vx-');
    const t = this.tc();
    const ventasPorDia = this.ventas['ventasPorDia'] as Record<string, number> | undefined;
    if (ventasPorDia) {
      const labels = Object.keys(ventasPorDia);
      const data = labels.map((k) => Number(ventasPorDia[k]));
      const el = document.getElementById('vx-line-dia') as HTMLCanvasElement | null;
      if (el) {
        const ch = new Chart(el, {
          type: 'line',
          data: { labels, datasets: [{ label: 'Ventas (S/)', data, borderColor: '#2563eb', tension: 0.2 }] },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('vx-line-dia', ch);
      }
    }

    const pedidosPorEstado = this.ventas['pedidosPorEstado'] as Record<string, number> | undefined;
    if (pedidosPorEstado) {
      const el = document.getElementById('vx-donut-estado') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(pedidosPorEstado);
        const data = labels.map((k) => pedidosPorEstado[k]);
        const ch = new Chart(el, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: ['#1e3a8a', '#f97316', '#10b981', '#a855f7', '#64748b', '#eab308'] }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: t.text } } } },
        });
        this.charts.set('vx-donut-estado', ch);
      }
    }

    const ingresoPorHora = this.ventas['ingresoPorHora'] as { hora: number; monto: number }[] | undefined;
    if (ingresoPorHora?.length) {
      const el = document.getElementById('vx-bar-hora') as HTMLCanvasElement | null;
      if (el) {
        const labels = ingresoPorHora.map((x) => String(x.hora));
        const data = ingresoPorHora.map((x) => x.monto);
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'S/', data, backgroundColor: '#ea580c' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('vx-bar-hora', ch);
      }
    }

    const pedidosPorDiaSemana = this.ventas['pedidosPorDiaSemana'] as Record<string, number> | undefined;
    if (pedidosPorDiaSemana) {
      const orderKeys = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
      const labels = this.diasSemanaLabel;
      const data = orderKeys.map((k) => pedidosPorDiaSemana[k] ?? 0);
      const el = document.getElementById('vx-bar-dow') as HTMLCanvasElement | null;
      if (el) {
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Pedidos', data, backgroundColor: '#1d4ed8' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('vx-bar-dow', ch);
      }
    }

    const ticketSem = this.ventas['evolucionTicketSemanal'] as { semana: string; ticketPromedio: number }[] | undefined;
    if (ticketSem?.length) {
      const el = document.getElementById('vx-line-ticket') as HTMLCanvasElement | null;
      if (el) {
        const labels = ticketSem.map((x) => x.semana);
        const data = ticketSem.map((x) => x.ticketPromedio);
        const ch = new Chart(el, {
          type: 'line',
          data: { labels, datasets: [{ label: 'Ticket promedio', data, borderColor: '#059669', tension: 0.2 }] },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('vx-line-ticket', ch);
      }
    }

    const clima = this.ventas['climaTemperaturaVsMonto'] as { tempC: number; monto: number }[] | undefined;
    if (clima?.length) {
      const el = document.getElementById('vx-scatter-clima') as HTMLCanvasElement | null;
      if (el) {
        const ch = new Chart(el, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: 'Pedidos',
                data: clima.map((p) => ({ x: p.tempC, y: p.monto })),
                backgroundColor: '#7c3aed',
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { title: { display: true, text: '°C', color: t.subtle }, ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { title: { display: true, text: 'S/', color: t.subtle }, ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('vx-scatter-clima', ch);
      }
    }
  }

  heatmapMax(): number {
    const h = this.ventas?.['heatmapHoraDia'] as { valor: number }[] | undefined;
    if (!h?.length) return 1;
    return Math.max(1, ...h.map((x) => x.valor));
  }

  heatmapCell(h: number, d: number): number {
    const list = this.ventas?.['heatmapHoraDia'] as { hora: number; diaIndex: number; valor: number }[] | undefined;
    if (!list) return 0;
    const hit = list.find((x) => x.hora === h && x.diaIndex === d);
    return hit?.valor ?? 0;
  }

  private renderInventarioCharts(): void {
    if (!this.inventario) return;
    this.destroyPrefix('ix-');
    const t = this.tc();
    const stock = this.inventario['stockPorInsumo'] as { nombre: string; stock: number; umbral: number }[] | undefined;
    if (stock?.length) {
      const top = [...stock].sort((a, b) => a.stock - b.stock).slice(0, 12);
      const el = document.getElementById('ix-bar-stock') as HTMLCanvasElement | null;
      if (el) {
        const ch = new Chart(el, {
          type: 'bar',
          data: {
            labels: top.map((x) => x.nombre),
            datasets: [
              { label: 'Stock', data: top.map((x) => x.stock), backgroundColor: '#0ea5e9' },
              { label: 'Umbral', data: top.map((x) => x.umbral), backgroundColor: '#f97316' },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ix-bar-stock', ch);
      }
    }

    const consumoCat = this.inventario['consumoPorCategoria'] as Record<string, number> | undefined;
    if (consumoCat && Object.keys(consumoCat).length) {
      const el = document.getElementById('ix-donut-cat') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(consumoCat);
        const data = labels.map((k) => Number(consumoCat[k]));
        const ch = new Chart(el, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: ['#16a34a', '#dc2626', '#ca8a04', '#7c3aed', '#64748b'] }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: t.text } } } },
        });
        this.charts.set('ix-donut-cat', ch);
      }
    }

    const abastSem = this.inventario['movimientosAbastecimientoPorSemana'] as Record<string, number> | undefined;
    if (abastSem && Object.keys(abastSem).length) {
      const el = document.getElementById('ix-line-abast') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(abastSem);
        const data = labels.map((k) => Number(abastSem[k]));
        const ch = new Chart(el, {
          type: 'line',
          data: { labels, datasets: [{ label: 'Abastecimiento (S/)', data, borderColor: '#059669', tension: 0.2 }] },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ix-line-abast', ch);
      }
    }

    const marg = this.inventario['margenBrutoProductos'] as { nombre: string; margenBruto: number }[] | undefined;
    if (marg?.length) {
      const el = document.getElementById('ix-bar-margen') as HTMLCanvasElement | null;
      if (el) {
        const slice = marg.slice(0, 12);
        const ch = new Chart(el, {
          type: 'bar',
          data: {
            labels: slice.map((x) => x.nombre),
            datasets: [{ label: 'Margen (S/)', data: slice.map((x) => x.margenBruto), backgroundColor: '#c026d3' }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ix-bar-margen', ch);
      }
    }
  }

  private renderProductosCharts(): void {
    if (!this.productos) return;
    this.destroyPrefix('px-');
    const t = this.tc();
    const top = this.productos['topProductos'] as { nombre: string; unidadesVendidas: number }[] | undefined;
    if (top?.length) {
      const el = document.getElementById('px-bar-top') as HTMLCanvasElement | null;
      if (el) {
        const slice = top.slice(0, 12);
        const ch = new Chart(el, {
          type: 'bar',
          data: {
            labels: slice.map((x) => x.nombre),
            datasets: [{ label: 'Unidades', data: slice.map((x) => x.unidadesVendidas), backgroundColor: '#db2777' }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('px-bar-top', ch);
      }
    }

    const topMargen = this.productos['topProductos'] as { nombre: string; margenEstimado: number }[] | undefined;
    if (topMargen?.length) {
      const elM = document.getElementById('px-bar-margen') as HTMLCanvasElement | null;
      if (elM) {
        const sorted = [...topMargen].sort((a, b) => b.margenEstimado - a.margenEstimado).slice(0, 10);
        const ch2 = new Chart(elM, {
          type: 'bar',
          data: {
            labels: sorted.map((x) => x.nombre),
            datasets: [
              { label: 'Margen estimado (S/)', data: sorted.map((x) => x.margenEstimado), backgroundColor: '#0f766e' },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('px-bar-margen', ch2);
      }
    }

    const ingCat = this.productos['ingresosPorCategoria'] as Record<string, number> | undefined;
    if (ingCat && Object.keys(ingCat).length) {
      const el = document.getElementById('px-donut-ing') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(ingCat);
        const data = labels.map((k) => Number(ingCat[k]));
        const ch = new Chart(el, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: ['#2563eb', '#ea580c', '#22c55e', '#a855f7'] }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: t.text } } } },
        });
        this.charts.set('px-donut-ing', ch);
      }
    }

    const dist = this.productos['distribucionEstrellas'] as Record<string, number> | undefined;
    if (dist) {
      const el = document.getElementById('px-bar-stars') as HTMLCanvasElement | null;
      if (el) {
        const labels = ['1', '2', '3', '4', '5'];
        const data = labels.map((k) => Number(dist[k] ?? 0));
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Cantidad', data, backgroundColor: '#eab308' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('px-bar-stars', ch);
      }
    }
  }

  private renderClientesCharts(): void {
    if (!this.clientes) return;
    this.destroyPrefix('cx-');
    const t = this.tc();
    const dist = this.clientes['distribucionEstrellas'] as Record<string, number> | undefined;
    if (dist) {
      const el = document.getElementById('cx-bar-stars') as HTMLCanvasElement | null;
      if (el) {
        const labels = ['1', '2', '3', '4', '5'];
        const data = labels.map((k) => Number(dist[k] ?? 0));
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Valoraciones', data, backgroundColor: '#38bdf8' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('cx-bar-stars', ch);
      }
    }

    const hist = this.clientes['frecuenciaPedidosHistograma'] as Record<string, number> | undefined;
    if (hist) {
      const el = document.getElementById('cx-bar-freq') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(hist);
        const data = labels.map((k) => hist[k]);
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Clientes', data, backgroundColor: '#4f46e5' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('cx-bar-freq', ch);
      }
    }
  }

  private renderOperacionCharts(): void {
    if (!this.operacion) return;
    this.destroyPrefix('ox-');
    const t = this.tc();
    const histEnt = this.operacion['histogramaTiemposEntrega'] as Record<string, number> | undefined;
    if (histEnt && Object.keys(histEnt).length) {
      const el = document.getElementById('ox-bar-hist') as HTMLCanvasElement | null;
      if (el) {
        const order = ['0-20', '20-40', '40-60', '60+'];
        const labels = order.filter((k) => k in histEnt);
        const data = labels.map((k) => histEnt[k]);
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Pedidos', data, backgroundColor: '#6366f1' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ox-bar-hist', ch);
      }
    }

    const ent = this.operacion['entregasPorRepartidor'] as Record<string, number> | undefined;
    if (ent && Object.keys(ent).length) {
      const el = document.getElementById('ox-bar-rep') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(ent);
        const data = labels.map((k) => ent[k]);
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Entregas', data, backgroundColor: '#0d9488' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ox-bar-rep', ch);
      }
    }

    const caj = this.operacion['cajeroValidadosVsRechazados'] as { cajero: string; validados: number; rechazados: number }[] | undefined;
    if (caj?.length) {
      const el = document.getElementById('ox-bar-cajero') as HTMLCanvasElement | null;
      if (el) {
        const labels = caj.map((x) => x.cajero);
        const ch = new Chart(el, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Superaron validación', data: caj.map((x) => x.validados), backgroundColor: '#2563eb' },
              { label: 'Cancelados en caja', data: caj.map((x) => x.rechazados), backgroundColor: '#dc2626' },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ox-bar-cajero', ch);
      }
    }

    const emb = this.operacion['embudoPorHora'] as { hora: number; porEstado: Record<string, number> }[] | undefined;
    if (emb?.length) {
      const estados = new Set<string>();
      emb.forEach((e) => Object.keys(e.porEstado ?? {}).forEach((s) => estados.add(s)));
      const estadoList = [...estados].slice(0, 6);
      const labels = emb.map((x) => String(x.hora));
      const colors = ['#1e3a8a', '#ea580c', '#16a34a', '#a855f7', '#dc2626', '#ca8a04'];
      const el = document.getElementById('ox-line-embudo') as HTMLCanvasElement | null;
      if (el) {
        const ch = new Chart(el, {
          type: 'line',
          data: {
            labels,
            datasets: estadoList.map((st, i) => ({
              label: st,
              data: emb.map((row) => row.porEstado[st] ?? 0),
              borderColor: colors[i % colors.length],
              tension: 0.2,
              fill: false,
            })),
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ox-line-embudo', ch);
      }
    }
  }

  private renderSeguridadCharts(): void {
    if (!this.seguridad) return;
    this.destroyPrefix('sx-');
    const t = this.tc();
    const porHora = this.seguridad['intentosPorHora'] as { hora: number; success: number; failed: number; blocked: number }[] | undefined;
    if (porHora?.length) {
      const el = document.getElementById('sx-line-login') as HTMLCanvasElement | null;
      if (el) {
        const labels = porHora.map((x) => String(x.hora));
        const ch = new Chart(el, {
          type: 'line',
          data: {
            labels,
            datasets: [
              { label: 'Éxito', data: porHora.map((x) => x.success), borderColor: '#22c55e', tension: 0.2 },
              { label: 'Fallo', data: porHora.map((x) => x.failed), borderColor: '#ef4444', tension: 0.2 },
              { label: 'Bloqueo', data: porHora.map((x) => x.blocked), borderColor: '#a855f7', tension: 0.2 },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: t.text } } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('sx-line-login', ch);
      }
    }

    const kp = this.seguridad['kpis'] as {
      totalIntentos?: number;
      eventosBloqueo?: number;
      intentosFallidos?: number;
    } | undefined;
    const ok = (kp?.totalIntentos ?? 0) - (kp?.intentosFallidos ?? 0) - (kp?.eventosBloqueo ?? 0);
    const elDon = document.getElementById('sx-donut-res') as HTMLCanvasElement | null;
    if (elDon && kp?.totalIntentos && kp.totalIntentos > 0) {
      const ch = new Chart(elDon, {
        type: 'doughnut',
        data: {
          labels: ['Éxito', 'Fallo', 'Bloqueo'],
          datasets: [
            {
              data: [
                Math.max(0, ok),
                kp.intentosFallidos ?? 0,
                kp.eventosBloqueo ?? 0,
              ],
              backgroundColor: ['#22c55e', '#ef4444', '#a855f7'],
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: t.text } } } },
      });
      this.charts.set('sx-donut-res', ch);
    }
  }

  private renderInteraccionesCharts(): void {
    if (!this.interacciones) return;
    this.destroyPrefix('ux-');
    const t = this.tc();
    const dist = this.interacciones['distribucionAcciones'] as Record<string, number> | undefined;
    if (dist && Object.keys(dist).length) {
      const el = document.getElementById('ux-donut-acc') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(dist);
        const data = labels.map((k) => dist[k]);
        const ch = new Chart(el, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: ['#6366f1', '#f97316', '#14b8a6', '#ec4899', '#84cc16'] }],
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: t.text } } } },
        });
        this.charts.set('ux-donut-acc', ch);
      }
    }

    const seg = this.interacciones['porSegmentoDia'] as Record<string, number> | undefined;
    if (seg && Object.keys(seg).length) {
      const el = document.getElementById('ux-bar-seg') as HTMLCanvasElement | null;
      if (el) {
        const labels = Object.keys(seg);
        const data = labels.map((k) => seg[k]);
        const ch = new Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Interacciones', data, backgroundColor: '#8b5cf6' }] },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: t.subtle }, grid: { color: t.grid } },
              y: { ticks: { color: t.subtle }, grid: { color: t.grid } },
            },
          },
        });
        this.charts.set('ux-bar-seg', ch);
      }
    }
  }

  formatSol(n: unknown): string {
    const v = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
    return (
      'S/ ' +
      v.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  formatPct(n: unknown): string {
    const v = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
    return v.toLocaleString('es-PE', { maximumFractionDigits: 2 }) + '%';
  }

  formatNum(n: unknown): string {
    const v = typeof n === 'number' ? n : parseFloat(String(n ?? 0));
    return v.toLocaleString('es-PE', { maximumFractionDigits: 2 });
  }
}
