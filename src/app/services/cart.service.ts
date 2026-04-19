import { Injectable, computed, signal } from '@angular/core';

export const MAX_UNIDADES_POR_PRODUCTO = 10;

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  thumbSrc: string;
}

export interface ProductoCarritoInput {
  id: string;
  name: string;
  price: number;
  imagesBase64: string[] | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly lines = signal<CartLine[]>([]);

  readonly items = this.lines.asReadonly();

  readonly totalUnidades = computed(() => this.lines().reduce((s, l) => s + l.quantity, 0));

  readonly totalOrden = computed(() =>
    this.lines().reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  );

  subtotalLinea(line: CartLine): number {
    return line.unitPrice * line.quantity;
  }

  agregarUno(p: ProductoCarritoInput): void {
    const thumb =
      p.imagesBase64 && p.imagesBase64.length > 0 && p.imagesBase64[0]
        ? p.imagesBase64[0]
        : 'assets/no-image.png';
    this.lines.update((list) => {
      const idx = list.findIndex((x) => x.productId === p.id);
      if (idx === -1) {
        return [
          ...list,
          {
            productId: p.id,
            name: p.name,
            unitPrice: p.price,
            quantity: 1,
            thumbSrc: thumb,
          },
        ];
      }
      const cur = list[idx];
      if (cur.quantity >= MAX_UNIDADES_POR_PRODUCTO) {
        return list;
      }
      const next = [...list];
      next[idx] = { ...cur, quantity: cur.quantity + 1 };
      return next;
    });
  }

  incrementar(productId: string): void {
    this.lines.update((list) => {
      const idx = list.findIndex((x) => x.productId === productId);
      if (idx === -1) return list;
      const cur = list[idx];
      if (cur.quantity >= MAX_UNIDADES_POR_PRODUCTO) return list;
      const next = [...list];
      next[idx] = { ...cur, quantity: cur.quantity + 1 };
      return next;
    });
  }

  decrementar(productId: string): void {
    this.lines.update((list) => {
      const idx = list.findIndex((x) => x.productId === productId);
      if (idx === -1) return list;
      const cur = list[idx];
      if (cur.quantity <= 1) {
        return list.filter((x) => x.productId !== productId);
      }
      const next = [...list];
      next[idx] = { ...cur, quantity: cur.quantity - 1 };
      return next;
    });
  }

  quitar(productId: string): void {
    this.lines.update((list) => list.filter((x) => x.productId !== productId));
  }

  limpiar(): void {
    this.lines.set([]);
  }
}
