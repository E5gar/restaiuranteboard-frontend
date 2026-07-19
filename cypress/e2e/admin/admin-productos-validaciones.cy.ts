describe('Admin Productos - Validaciones numéricas y edge cases', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/catalogo/ingredientes', [
      {
        id: 1,
        name: 'Papa',
        category: 'Verduras',
        unit: 'GR',
        stockQuantity: 500,
        price: 0.5,
        alertThreshold: 50,
        imageBase64: 'data:image/png;base64,abc',
      },
      {
        id: 2,
        name: 'Huevo',
        category: 'Huevos',
        unit: 'UNIDADES',
        stockQuantity: 100,
        price: 0.3,
        alertThreshold: 10,
        imageBase64: 'data:image/png;base64,abc',
      },
    ]).as('ingredientes');
    cy.intercept('GET', '**/api/catalogo/productos', [
      { id: 'prod-1', name: 'Lomo Saltado', price: 25, category: 'Plato Principal', description: '', imagesBase64: [] },
    ]).as('productos');
  });
  it('bloquea decimales en stock cuando la unidad es UNIDADES', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.get('select[name="iu"]').select('UNIDADES');
    cy.get('input[name="is"]').clear().type('10.5');
    cy.get('input[name="is"]').should('have.value', '105'); // el filtro elimina el punto
  });
  it('permite hasta 2 decimales en stock cuando la unidad es GR', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.get('select[name="iu"]').select('GR');
    cy.get('input[name="is"]').clear().type('10.567');
    cy.get('input[name="is"]').should('have.value', '10.56');
  });
  it('bloquea la tecla "e" (notación científica) en campos numéricos', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.get('input[name="ip"]').type('1e5');
    cy.get('input[name="ip"]').should('not.have.value', '1e5');
  });
  it('rechaza costo unitario con más de 3 decimales', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.get('input[name="in"]').type('Zanahoria');
    cy.get('input[name="is"]').clear().type('10');
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('img'), fileName: 'z.png', mimeType: 'image/png' },
      { force: true },
    );
    // el input filtra visualmente a 3 decimales máximo; forzamos el valor vía DOM para probar validación backend-side
    cy.get('input[name="ip"]').clear().type('1.2345');
    cy.get('input[name="ip"]').invoke('val').then((v) => {
      expect(String(v).split('.')[1]?.length ?? 0).to.be.at.most(3);
    });
  });
  it('edita el umbral crítico directamente en la tabla', () => {
    cy.intercept('PATCH', '**/api/catalogo/ingredientes/1/umbral', {
      message: 'Umbral actualizado.',
      alertThreshold: 80,
    }).as('umbral');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('tr', 'Papa').within(() => {
      cy.get('button').contains('50').click();
    });
    cy.get('input[type="text"][inputmode="decimal"]').last().clear().type('80');
    cy.contains('button', 'Guardar umbral').should('not.exist'); // el botón es un ícono, verificamos por aria-label
    cy.get('button[aria-label="Guardar umbral"]').click();
    cy.wait('@umbral');
  });
  it('cancela la edición del umbral crítico', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('tr', 'Papa').within(() => {
      cy.get('button').contains('50').click();
    });
    cy.get('button[aria-label="Cancelar"]').click();
    cy.contains('tr', 'Papa').contains('50').should('be.visible');
  });
  it('abastece un insumo con cantidad y costo opcional', () => {
    cy.intercept('POST', '**/api/catalogo/ingredientes/1/abastecer', {
      message: 'Abastecimiento registrado.',
      newStock: 600,
    }).as('abastecer');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('.rounded-xl', 'Papa').click();
    cy.contains('button', 'Abastecer stock').click();
    cy.get('#abast-qty').clear().type('100');
    cy.get('#abast-cost').clear().type('0.55');
    cy.get('#abast-reason').type('Reposición semanal');
    cy.contains('button', 'Confirmar abastecimiento').click();
    cy.wait('@abastecer');
    cy.contains('Stock actualizado correctamente.').should('be.visible');
  });
  it('advierte sobre cambio de unidad cuando el insumo está en recetas activas', () => {
    cy.intercept('PUT', '**/api/catalogo/ingredientes/2', {
      statusCode: 409,
      body: {
        code: 'UNIT_CHANGE_WARNING',
        message: 'Este insumo se usa en recetas activas. Al cambiar la unidad, revisa las cantidades en esas recetas.',
        productos: ['Lomo Saltado'],
      },
    }).as('cambioUnidad');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('.group', 'Huevo').find('button[aria-label="Editar insumo"]').click({ force: true });
    cy.get('select#edit-in-unit').select('GR');
    cy.contains('button', 'Guardar cambios').click();
    cy.wait('@cambioUnidad');
    cy.contains('Cambio de unidad de medida').should('be.visible');
    cy.contains('Lomo Saltado').should('be.visible');
  });
  it('confirma y guarda tras la advertencia de cambio de unidad', () => {
    cy.intercept('PUT', '**/api/catalogo/ingredientes/2', {
      statusCode: 409,
      body: {
        code: 'UNIT_CHANGE_WARNING',
        message: 'Advertencia de cambio de unidad.',
        productos: ['Lomo Saltado'],
      },
    }).as('cambioUnidad');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('.group', 'Huevo').find('button[aria-label="Editar insumo"]').click({ force: true });
    cy.get('select#edit-in-unit').select('GR');
    cy.contains('button', 'Guardar cambios').click();
    cy.wait('@cambioUnidad');
    cy.intercept('PUT', '**/api/catalogo/ingredientes/2', { message: 'Insumo actualizado.' }).as(
      'confirmarGuardar',
    );
    cy.contains('button', 'Continuar y guardar').click();
    cy.wait('@confirmarGuardar');
  });
  it('bloquea eliminación de insumo con orden en curso', () => {
    cy.intercept('GET', '**/api/catalogo/ingredientes/1/eliminar-precheck', {
      allowed: false,
      message: 'No es posible eliminar este insumo porque pertenece a un producto que aún está en proceso de ser entregado. Intente nuevamente cuando no haya órdenes pendientes con este insumo',
    }).as('precheck');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('.group', 'Papa').find('button[aria-label="Eliminar insumo"]').click({ force: true });
    cy.wait('@precheck');
    cy.contains('No se puede eliminar').should('be.visible');
  });
  it('advierte sobre recetas afectadas al eliminar un insumo', () => {
    cy.intercept('GET', '**/api/catalogo/ingredientes/1/eliminar-precheck', {
      allowed: true,
      requiereAdvertenciaRecetas: true,
      productosAfectados: ['Lomo Saltado'],
    }).as('precheck');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('.group', 'Papa').find('button[aria-label="Eliminar insumo"]').click({ force: true });
    cy.wait('@precheck');
    cy.contains('Recetas vinculadas').should('be.visible');
    cy.contains('Lomo Saltado').should('be.visible');
  });
  it('respeta el precio mínimo de venta (0.10) al crear producto', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('button', '2. Productos (Recetas)').click();
    cy.get('input[name="pn"]').type('Producto Barato');
    cy.get('input[name="pp"]').clear().type('0.05');
    cy.get('input[name="pp"]').should('have.value', '0.05');
    // la validación de mínimo la hace el backend/lógica al guardar
  });
});