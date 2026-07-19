describe('Administrar ingredientes y productos', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/catalogo/ingredientes', [
      { id: 1, name: 'Papa', category: 'Verduras', unit: 'GR', stockQuantity: 500, price: 0.5, alertThreshold: 50, imageBase64: '' },
    ]).as('ingredientes');
    cy.intercept('GET', '**/api/catalogo/productos', [
      { id: 'prod-1', name: 'Lomo Saltado', price: 25, category: 'Plato Principal', description: '', imagesBase64: [] },
    ]).as('productos');
  });

  it('lista ingredientes y productos', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('Papa').should('be.visible');
    cy.contains('button', '2. Productos (Recetas)').click();
    cy.contains('Lomo Saltado').should('be.visible');
  });

  it('valida el nombre obligatorio al crear un insumo', () => {
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('button', 'Guardar Ingrediente').click();
    cy.contains('Nombre inválido').should('be.visible');
  });

  it('crea un nuevo insumo', () => {
    cy.intercept('POST', '**/api/catalogo/ingredientes', { message: 'Ingrediente guardado en SQL' }).as(
      'crearIngrediente',
    );
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.get('input[name="in"]').type('Cebolla');
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('img'), fileName: 'cebolla.png', mimeType: 'image/png' },
      { force: true },
    );
    cy.contains('button', 'Guardar Ingrediente').click();
    cy.wait('@crearIngrediente');
    cy.contains('Ingrediente registrado en el inventario.').should('be.visible');
  });

  it('bloquea la eliminación de un producto con pedidos en curso', () => {
    cy.intercept('GET', '**/api/catalogo/productos/prod-1/eliminar-precheck', {
      allowed: false,
      message: 'No es posible eliminar este producto porque aún está en proceso de ser entregado.',
    }).as('precheck');
    cy.visit('/admin-productos');
    cy.wait(['@ingredientes', '@productos']);
    cy.contains('button', '2. Productos (Recetas)').click();
    cy.get('.group').contains('Lomo Saltado').parents('.group').find('button[aria-label="Eliminar producto"]').click({ force: true });
    cy.wait('@precheck');
    cy.contains('No se puede eliminar').should('be.visible');
  });
});