import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from '../logout-button/logout-button';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LogoutButtonComponent],
  templateUrl: './admin-productos.component.html',
})
export class AdminProductosComponent implements OnInit {
  pestanaActiva = 'ingredientes';
  cargando = false;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  nuevoIngrediente = {
    name: '',
    unit: 'UNIDADES',
    stockQuantity: 0,
    category: 'Carnes',
    price: 0,
    imageBase64: '',
  };
  ingredientes: any[] = [];

  nuevoProducto: any = {
    name: '',
    price: 0,
    category: 'Platos',
    description: '',
    imagesBase64: [],
  };
  recetaActual: { ingredientId: number; name: string; quantity: number; unit: string }[] = [];
  ingredienteSeleccionadoId: number | string = '';
  cantidadParaReceta = 1;
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
      .get<any[]>('https://restaiuranteboard-backend.onrender.com/api/catalogo/ingredientes')
      .subscribe({
        next: (data) => (this.ingredientes = data),
        error: (err) => console.error('Error cargando ingredientes', err),
      });

    this.http
      .get<any[]>('https://restaiuranteboard-backend.onrender.com/api/catalogo/productos')
      .subscribe({
        next: (data) => (this.productos = data),
        error: (err) => console.error('Error cargando productos', err),
      });
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

  guardarIngrediente() {
    if (!this.nuevoIngrediente.name || this.nuevoIngrediente.price <= 0) {
      return this.abrirModal(
        'error',
        'Datos Inválidos',
        'El ingrediente necesita nombre y un precio válido.',
      );
    }

    this.cargando = true;
    this.http
      .post(
        'https://restaiuranteboard-backend.onrender.com/api/catalogo/ingredientes',
        this.nuevoIngrediente,
      )
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModal('exito', 'Guardado', 'Ingrediente registrado en el inventario.');
          this.nuevoIngrediente = {
            name: '',
            unit: 'UNIDADES',
            stockQuantity: 0,
            category: 'Carnes',
            price: 0,
            imageBase64: '',
          };
          this.cargarDatos();
        },
        error: () => {
          this.cargando = false;
          this.abrirModal('error', 'Error', 'No se pudo guardar el ingrediente.');
        },
      });
  }

  agregarInsumoAReceta() {
    if (!this.ingredienteSeleccionadoId || this.cantidadParaReceta <= 0) return;

    const insumo = this.ingredientes.find((i) => i.id == this.ingredienteSeleccionadoId);
    if (insumo) {
      const index = this.recetaActual.findIndex((r) => r.ingredientId === insumo.id);
      if (index >= 0) {
        this.recetaActual[index].quantity += this.cantidadParaReceta;
      } else {
        this.recetaActual.push({
          ingredientId: insumo.id,
          name: insumo.name,
          quantity: this.cantidadParaReceta,
          unit: insumo.unit,
        });
      }
      this.cantidadParaReceta = 1;
      this.ingredienteSeleccionadoId = '';
    }
  }

  quitarInsumo(index: number) {
    this.recetaActual.splice(index, 1);
  }

  guardarProducto() {
    if (!this.nuevoProducto.name || this.nuevoProducto.price <= 0) {
      return this.abrirModal(
        'error',
        'Datos Inválidos',
        'Revisa el nombre y el precio del producto.',
      );
    }
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

    this.http
      .post('https://restaiuranteboard-backend.onrender.com/api/catalogo/productos', payload)
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
            price: 0,
            category: 'Platos',
            description: '',
            imagesBase64: [],
          };
          this.recetaActual = [];
          this.cargarDatos();
        },
        error: (err) => {
          this.cargando = false;
          this.abrirModal(
            'error',
            'Error',
            err.error?.message || 'No se pudo guardar el producto.',
          );
        },
      });
  }

  eliminarProducto(idMongo: string) {
    if (confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      this.http
        .delete(`https://restaiuranteboard-backend.onrender.com/api/catalogo/productos/${idMongo}`)
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
