import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-productos.component.html'
})
export class AdminProductosComponent implements OnInit {
  pestanaActiva = 'ingredientes'; 
  cargando = false;
  modal = { visible: false, tipo: 'info', titulo: '', mensaje: '' };

  // --- INGREDIENTES (PostgreSQL) ---
  nuevoIngrediente = { name: '', unit: 'UNIDADES', stockQuantity: 0, category: 'Carnes', price: 0, imageBase64: '' };
  ingredientes: any[] = [];

  // --- PRODUCTOS (MongoDB + Receta en SQL) ---
  nuevoProducto: any = { name: '', price: 0, category: 'Platos', description: '', imagesBase64: [] };
  recetaActual: { ingredientId: number, name: string, quantity: number, unit: string }[] = [];
  ingredienteSeleccionadoId: number | string = '';
  cantidadParaReceta = 1;
  productos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
  }

  cargarDatos() {
    // GET Insumos
    this.http.get<any[]>('http://localhost:8080/api/catalogo/ingredientes').subscribe({
      next: (data) => this.ingredientes = data,
      error: (err) => console.error('Error cargando ingredientes', err)
    });

    // GET Productos
    this.http.get<any[]>('http://localhost:8080/api/catalogo/productos').subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  // --- MANEJO DE IMÁGENES A BASE64 ---
  onSingleFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.nuevoIngrediente.imageBase64 = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  onMultipleFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = () => {
          this.nuevoProducto.imagesBase64.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  eliminarImagenProducto(index: number) {
    this.nuevoProducto.imagesBase64.splice(index, 1);
  }

  // --- LÓGICA DE INGREDIENTES ---
  guardarIngrediente() {
    if (!this.nuevoIngrediente.name || this.nuevoIngrediente.price <= 0) {
      return this.abrirModal('error', 'Datos Inválidos', 'El ingrediente necesita nombre y un precio válido.');
    }
    
    this.cargando = true;
    this.http.post('http://localhost:8080/api/catalogo/ingredientes', this.nuevoIngrediente).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal('exito', 'Guardado', 'Ingrediente registrado en el inventario.');
        this.nuevoIngrediente = { name: '', unit: 'UNIDADES', stockQuantity: 0, category: 'Carnes', price: 0, imageBase64: '' };
        this.cargarDatos();
      },
      error: () => {
        this.cargando = false;
        this.abrirModal('error', 'Error', 'No se pudo guardar el ingrediente.');
      }
    });
  }

  // --- LÓGICA DE RECETAS (Unir Insumo a Plato) ---
  agregarInsumoAReceta() {
    if (!this.ingredienteSeleccionadoId || this.cantidadParaReceta <= 0) return;
    
    const insumo = this.ingredientes.find(i => i.id == this.ingredienteSeleccionadoId);
    if (insumo) {
      // Evitar duplicados
      const index = this.recetaActual.findIndex(r => r.ingredientId === insumo.id);
      if(index >= 0) {
        this.recetaActual[index].quantity += this.cantidadParaReceta;
      } else {
        this.recetaActual.push({
          ingredientId: insumo.id,
          name: insumo.name,
          quantity: this.cantidadParaReceta,
          unit: insumo.unit
        });
      }
      this.cantidadParaReceta = 1; 
      this.ingredienteSeleccionadoId = '';
    }
  }

  quitarInsumo(index: number) {
    this.recetaActual.splice(index, 1);
  }

  // --- LÓGICA DE PRODUCTOS ---
  guardarProducto() {
    if (!this.nuevoProducto.name || this.nuevoProducto.price <= 0) {
      return this.abrirModal('error', 'Datos Inválidos', 'Revisa el nombre y el precio del producto.');
    }
    if (this.recetaActual.length === 0) {
      return this.abrirModal('error', 'Receta Vacía', 'Un producto debe tener al menos un ingrediente para descontar del inventario.');
    }
    if (this.nuevoProducto.imagesBase64.length === 0) {
      return this.abrirModal('error', 'Falta Imagen', 'Debes subir al menos una foto del plato.');
    }

    this.cargando = true;
    const payload = {
      producto: this.nuevoProducto,
      receta: this.recetaActual // DTO espera { ingredientId, quantity }
    };

    this.http.post('http://localhost:8080/api/catalogo/productos', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.abrirModal('exito', 'Plato Creado', 'Producto guardado en el catálogo y receta vinculada.');
        this.nuevoProducto = { name: '', price: 0, category: 'Platos', description: '', imagesBase64: [] };
        this.recetaActual = [];
        this.cargarDatos();
      },
      error: (err) => {
        this.cargando = false;
        this.abrirModal('error', 'Error', err.error?.message || 'No se pudo guardar el producto.');
      }
    });
  }

  eliminarProducto(idMongo: string) {
    if(confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      this.http.delete(`http://localhost:8080/api/catalogo/productos/${idMongo}`).subscribe({
        next: () => this.cargarDatos(),
        error: () => this.abrirModal('error', 'Error', 'No se pudo eliminar.')
      });
    }
  }

  abrirModal(tipo: string, titulo: string, mensaje: string) {
    this.modal = { visible: true, tipo, titulo, mensaje };
  }
  cerrarModal() { this.modal.visible = false; }
}