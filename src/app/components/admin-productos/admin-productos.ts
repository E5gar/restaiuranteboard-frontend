import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

export interface CatOpcion {
  value: string;
  label: string;
  img: string;
}

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './admin-productos.component.html',
})
export class AdminProductosComponent implements OnInit {
  readonly categoriasProducto: CatOpcion[] = [
    { value: 'Entrada', label: 'Entrada', img: '/iconos/categoria-entrada.png' },
    { value: 'Plato Principal', label: 'Plato Principal', img: '/iconos/categoria-plato-principal.png' },
    { value: 'Postres', label: 'Postres', img: '/iconos/categoria-postres.png' },
    { value: 'Bebidas', label: 'Bebidas', img: '/iconos/categoria-bebidas.png' },
  ];

  readonly categoriasIngrediente: CatOpcion[] = [
    { value: 'Verduras', label: 'Verduras', img: '/iconos/categoria-verduras.png' },
    { value: 'Carnes', label: 'Carnes', img: '/iconos/categoria-carnes.png' },
    { value: 'Huevos', label: 'Huevos', img: '/iconos/categoria-huevos.png' },
    { value: 'Marinos', label: 'Marinos', img: '/iconos/categoria-marinos.png' },
    { value: 'Abarrotes', label: 'Abarrotes', img: '/iconos/categoria-abarrotes.png' },
    { value: 'Lácteos', label: 'Lácteos', img: '/iconos/categoria-lacteos.png' },
    { value: 'Bebidas', label: 'Bebidas', img: '/iconos/categoria-bebidas.png' },
    { value: 'Frutas', label: 'Frutas', img: '/iconos/categoria-frutas.png' },
    { value: 'Panadería', label: 'Panadería', img: '/iconos/categoria-panaderia.png' },
  ];

  private readonly apiCatalogo = 'https://restaiuranteboard-backend.onrender.com/api/catalogo';

  pestanaActiva = 'ingredientes';
  cargando = false;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  nuevoIngrediente = {
    name: '',
    unit: 'UNIDADES',
    stockQuantity: 0,
    category: 'Verduras',
    price: 0,
    imageBase64: '',
  };
  /** Texto en inputs para evitar notación científica (e) en type="number". */
  ingredienteStockText = '0';
  ingredienteCostoText = '0';

  ingredientes: any[] = [];

  nuevoProducto: any = {
    name: '',
    price: 0.1,
    category: 'Entrada',
    description: '',
    imagesBase64: [],
  };
  productoPrecioText = '0.10';

  recetaActual: { ingredientId: number; name: string; quantity: number; unit: string }[] = [];
  ingredienteSeleccionadoId: number | string = '';
  cantidadRecetaText = '1';

  busquedaReceta = '';
  /** 'ALL' o valor de categoría de insumo */
  filtroCategoriaReceta: string = 'ALL';

  busquedaAlmacen = '';
  filtroCategoriaAlmacen: string = 'ALL';
  ingredienteSeleccionadoAlmacenId: number | '' = '';

  busquedaCatalogo = '';
  filtroCategoriaCatalogo: string = 'ALL';

  modalAbastecer: { visible: boolean; insumo: any | null } = { visible: false, insumo: null };
  abastecerCantidadText = '1';
  abastecerCostoText = '';
  abastecerRazonText = '';

  productos: any[] = [];
  private readonly tiposImagenPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
  private readonly maxBytesImagen = 5 * 1024 * 1024;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
  }

  cargarDatos() {
    this.http
      .get<any[]>(`${this.apiCatalogo}/ingredientes`)
      .subscribe({
        next: (data) => (this.ingredientes = data),
        error: (err) => console.error('Error cargando ingredientes', err),
      });

    this.http
      .get<any[]>(`${this.apiCatalogo}/productos`)
      .subscribe({
        next: (data) => (this.productos = data),
        error: (err) => console.error('Error cargando productos', err),
      });
  }

  seleccionarCategoriaIngrediente(cat: string) {
    this.nuevoIngrediente.category = cat;
    this.onCambioUnidadIngrediente();
  }

  seleccionarCategoriaProducto(cat: string) {
    this.nuevoProducto.category = cat;
  }

  onCambioUnidadIngrediente() {
    if (this.nuevoIngrediente.unit === 'UNIDADES') {
      this.ingredienteStockText = this.sinDecimalesTexto(this.ingredienteStockText);
    }
  }

  get insumosFiltradosReceta(): any[] {
    const q = (this.busquedaReceta || '').trim().toLowerCase();
    return this.ingredientes.filter((i) => {
      if (this.filtroCategoriaReceta !== 'ALL' && i.category !== this.filtroCategoriaReceta) return false;
      if (!q) return true;
      return String(i.name || '')
        .toLowerCase()
        .includes(q);
    });
  }

  get insumosFiltradosAlmacen(): any[] {
    const q = (this.busquedaAlmacen || '').trim().toLowerCase();
    return this.ingredientes.filter((i) => {
      if (this.filtroCategoriaAlmacen !== 'ALL' && i.category !== this.filtroCategoriaAlmacen) return false;
      if (!q) return true;
      return String(i.name || '')
        .toLowerCase()
        .includes(q);
    });
  }

  get productosFiltradosCatalogo(): any[] {
    const q = (this.busquedaCatalogo || '').trim().toLowerCase();
    return this.productos.filter((p) => {
      if (this.filtroCategoriaCatalogo !== 'ALL' && p.category !== this.filtroCategoriaCatalogo) return false;
      if (!q) return true;
      return String(p.name || '')
        .toLowerCase()
        .includes(q);
    });
  }

  get nombreInsumoSeleccionadoAlmacen(): string {
    if (!this.ingredienteSeleccionadoAlmacenId) return '';
    const i = this.ingredientes.find((x) => x.id == this.ingredienteSeleccionadoAlmacenId);
    return (i?.name as string) || '';
  }

  seleccionarInsumoAlmacen(id: number) {
    this.ingredienteSeleccionadoAlmacenId = id;
  }

  imgIconoIngrediente(cat: string | undefined): string {
    const c = (cat || '').trim();
    return this.categoriasIngrediente.find((x) => x.value === c)?.img ?? '/iconos/lupa.png';
  }

  imgIconoProducto(cat: string | undefined): string {
    const c = (cat || '').trim();
    return this.categoriasProducto.find((x) => x.value === c)?.img ?? '/iconos/lupa.png';
  }

  get unidadAbastecerModal(): string {
    return (this.modalAbastecer.insumo?.unit as string) || 'UNIDADES';
  }

  abrirModalAbastecer() {
    if (!this.ingredienteSeleccionadoAlmacenId) {
      this.abrirModal('error', 'Selección', 'Selecciona un insumo de la lista.');
      return;
    }
    const insumo = this.ingredientes.find((i) => i.id == this.ingredienteSeleccionadoAlmacenId);
    if (!insumo) return;
    this.modalAbastecer = { visible: true, insumo };
    this.abastecerCantidadText = '1';
    this.abastecerCostoText = '';
    this.abastecerRazonText = '';
  }

  cerrarModalAbastecer() {
    this.modalAbastecer = { visible: false, insumo: null };
  }

  confirmarAbastecer() {
    const ins = this.modalAbastecer.insumo;
    if (!ins?.id) return;

    const unit = ins.unit as string;
    const maxDec = unit === 'UNIDADES' ? 0 : 2;
    const qty = this.parseNumeroFlexible(this.abastecerCantidadText, {
      maxDecimals: maxDec,
      integerOnly: unit === 'UNIDADES',
    });
    if (qty === null || qty <= 0) {
      return this.abrirModal(
        'error',
        'Cantidad inválida',
        unit === 'UNIDADES'
          ? 'Indica un entero mayor que cero, sin decimales.'
          : 'Indica un valor mayor que cero, máximo dos decimales.',
      );
    }

    let unitCost: number | null = null;
    const ct = (this.abastecerCostoText || '').trim();
    if (ct) {
      const c = this.parseNumeroFlexible(ct, {
        maxDecimals: 2,
        integerOnly: false,
        min: 0,
      });
      if (c === null) {
        return this.abrirModal(
          'error',
          'Costo inválido',
          'Costo unitario opcional: no negativo, máximo dos decimales.',
        );
      }
      unitCost = c;
    }

    let reason: string | null = this.abastecerRazonText.trim();
    if (reason.length > 255) reason = reason.slice(0, 255);
    if (!reason) reason = null;

    this.cargando = true;
    const payload: { quantity: number; unitCost?: number | null; reason?: string | null } = {
      quantity: qty,
      reason,
    };
    if (unitCost !== null) payload.unitCost = unitCost;

    this.http.post(`${this.apiCatalogo}/ingredientes/${ins.id}/abastecer`, payload).subscribe({
      next: () => {
        this.cargando = false;
        this.cerrarModalAbastecer();
        this.abrirModal('exito', 'Abastecimiento', 'Stock actualizado correctamente.');
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando = false;
        const msg = err.error?.message || 'No se pudo registrar el abastecimiento.';
        this.abrirModal('error', 'Error', msg);
      },
    });
  }

  /** Unidad del insumo resaltado en la receta (para reglas de decimales en cantidad). */
  get unidadInsumoSeleccionado(): string {
    if (!this.ingredienteSeleccionadoId) return 'UNIDADES';
    const i = this.ingredientes.find((x) => x.id == this.ingredienteSeleccionadoId);
    return (i?.unit as string) || 'UNIDADES';
  }

  seleccionarInsumoParaReceta(id: number) {
    this.ingredienteSeleccionadoId = id;
  }

  bloquearNoEuler(event: KeyboardEvent, permitirDecimal: boolean) {
    const k = event.key;
    if (k === 'e' || k === 'E' || k === '+') {
      event.preventDefault();
      return;
    }
    if (k === '-' || k === '−') {
      event.preventDefault();
      return;
    }
    if (!permitirDecimal && (k === '.' || k === ',')) {
      event.preventDefault();
    }
  }

  onSingleFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const error = this.errorArchivoImagen(file);
      if (error) {
        this.abrirModal('error', 'Archivo inválido', error);
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => (this.nuevoIngrediente.imageBase64 = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onMultipleFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files?.length) {
      for (const file of Array.from(files)) {
        const error = this.errorArchivoImagen(file);
        if (error) {
          this.abrirModal('error', 'Archivo inválido', error);
          input.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.nuevoProducto.imagesBase64.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  errorArchivoImagen(file: File): string | null {
    if (file.size > this.maxBytesImagen) {
      return 'La imagen no debe pesar más de 5MB.';
    }
    if (!this.tiposImagenPermitidos.includes(file.type)) {
      return 'Solo se permite formato PNG o JPG.';
    }
    return null;
  }

  eliminarImagenProducto(index: number) {
    this.nuevoProducto.imagesBase64.splice(index, 1);
  }

  private sinDecimalesTexto(s: string): string {
    const n = this.parseNumeroFlexible(s, { maxDecimals: 0, integerOnly: true });
    if (n === null) return '0';
    return String(Math.round(n));
  }

  /**
   * Parse número positivo o cero; máximo `maxDecimals` decimales; sin e/E.
   */
  private parseNumeroFlexible(
    raw: string,
    opts: { maxDecimals: number; integerOnly: boolean; min?: number },
  ): number | null {
    const t = (raw ?? '').trim().replace(',', '.');
    if (t === '' || /[eE]/.test(t)) return null;
    if (!/^\d*\.?\d*$/.test(t)) return null;
    const n = Number(t);
    if (Number.isNaN(n) || n < 0) return null;
    if (opts.integerOnly && Math.abs(n - Math.round(n)) > 1e-9) return null;
    const factor = Math.pow(10, opts.maxDecimals);
    const scaled = Math.round(n * factor);
    if (Math.abs(n * factor - scaled) > 1e-6) return null;
    const rounded = scaled / factor;
    if (opts.min !== undefined && n + 1e-9 < opts.min) return null;
    return rounded;
  }

  guardarIngrediente() {
    if (!this.nuevoIngrediente.name?.trim()) {
      return this.abrirModal('error', 'Datos Inválidos', 'El ingrediente necesita nombre.');
    }

    const unit = this.nuevoIngrediente.unit;
    const maxDec = unit === 'UNIDADES' ? 0 : 2;
    const stock = this.parseNumeroFlexible(this.ingredienteStockText, {
      maxDecimals: maxDec,
      integerOnly: unit === 'UNIDADES',
    });
    if (stock === null) {
      return this.abrirModal(
        'error',
        'Stock inválido',
        unit === 'UNIDADES'
          ? 'Stock inicial: solo números enteros positivos o cero, sin decimales.'
          : 'Stock inicial: números positivos o cero, máximo dos decimales.',
      );
    }

    const costo = this.parseNumeroFlexible(this.ingredienteCostoText, {
      maxDecimals: 2,
      integerOnly: false,
      min: 0,
    });
    if (costo === null) {
      return this.abrirModal(
        'error',
        'Costo inválido',
        'Costo unitario: no negativo, máximo dos decimales, sin notación científica.',
      );
    }

    this.nuevoIngrediente.stockQuantity = stock;
    this.nuevoIngrediente.price = costo;

    this.cargando = true;
    this.http
      .post(`${this.apiCatalogo}/ingredientes`, this.nuevoIngrediente)
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal('exito', 'Guardado', 'Ingrediente registrado en el inventario.');
          this.nuevoIngrediente = {
            name: '',
            unit: 'UNIDADES',
            stockQuantity: 0,
            category: 'Verduras',
            price: 0,
            imageBase64: '',
          };
          this.ingredienteStockText = '0';
          this.ingredienteCostoText = '0';
          this.cargarDatos();
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error?.message || 'No se pudo guardar el ingrediente.';
          this.abrirModal('error', msg.includes('ya existe') ? 'Insumo duplicado' : 'Error', msg);
        },
      });
  }

  agregarInsumoAReceta() {
    if (!this.ingredienteSeleccionadoId) {
      this.abrirModal('error', 'Insumo', 'Selecciona un insumo de la lista o búsqueda.');
      return;
    }

    const insumo = this.ingredientes.find((i) => i.id == this.ingredienteSeleccionadoId);
    if (!insumo) return;

    const unit = insumo.unit as string;
    const maxDec = unit === 'UNIDADES' ? 0 : 2;
    const qty = this.parseNumeroFlexible(this.cantidadRecetaText, {
      maxDecimals: maxDec,
      integerOnly: unit === 'UNIDADES',
      min: 0,
    });
    if (qty === null || qty <= 0) {
      return this.abrirModal(
        'error',
        'Cantidad inválida',
        unit === 'UNIDADES'
          ? 'Cantidad: número entero positivo, sin decimales.'
          : 'Cantidad: número positivo, máximo dos decimales.',
      );
    }

    const index = this.recetaActual.findIndex((r) => r.ingredientId === insumo.id);
    if (index >= 0) {
      this.recetaActual[index].quantity += qty;
    } else {
      this.recetaActual.push({
        ingredientId: insumo.id,
        name: insumo.name,
        quantity: qty,
        unit: insumo.unit,
      });
    }
    this.cantidadRecetaText = '1';
    this.ingredienteSeleccionadoId = '';
  }

  quitarInsumo(index: number) {
    this.recetaActual.splice(index, 1);
  }

  guardarProducto() {
    if (!this.nuevoProducto.name?.trim()) {
      return this.abrirModal('error', 'Datos Inválidos', 'Revisa el nombre del producto.');
    }

    const precio = this.parseNumeroFlexible(this.productoPrecioText, {
      maxDecimals: 2,
      integerOnly: false,
      min: 0.1,
    });
    if (precio === null) {
      return this.abrirModal(
        'error',
        'Precio inválido',
        'Precio de venta: mínimo 0.10, máximo dos decimales, sin notación científica.',
      );
    }
    this.nuevoProducto.price = precio;

    if (this.recetaActual.length === 0) {
      return this.abrirModal(
        'error',
        'Receta Vacía',
        'Un producto debe tener al menos un ingrediente para descontar del inventario.',
      );
    }
    if (this.nuevoProducto.imagesBase64.length === 0) {
      return this.abrirModal('error', 'Falta Imagen', 'Debes subir al menos una foto del plato.');
    }

    this.cargando = true;
    const payload = {
      producto: this.nuevoProducto,
      receta: this.recetaActual,
    };

    this.http.post(`${this.apiCatalogo}/productos`, payload)
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal(
            'exito',
            'Plato Creado',
            'Producto guardado en el catálogo y receta vinculada.',
          );
          this.nuevoProducto = {
            name: '',
            price: 0.1,
            category: 'Entrada',
            description: '',
            imagesBase64: [],
          };
          this.productoPrecioText = '0.10';
          this.recetaActual = [];
          this.busquedaReceta = '';
          this.filtroCategoriaReceta = 'ALL';
          this.cargarDatos();
        },
        error: (err) => {
          this.cargando = false;
          const msg = err.error?.message || 'No se pudo guardar el producto.';
          this.abrirModal(
            'error',
            msg.includes('ya existe') ? 'Receta duplicada' : 'Error',
            msg,
          );
        },
      });
  }

  eliminarProducto(idMongo: string) {
    if (confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      this.http
        .delete(`${this.apiCatalogo}/productos/${idMongo}`)
        .subscribe({
          next: () => this.cargarDatos(),
          error: () => this.abrirModal('error', 'Error', 'No se pudo eliminar.'),
        });
    }
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }
  cerrarModal() {
    this.modal.visible = false;
  }
}
