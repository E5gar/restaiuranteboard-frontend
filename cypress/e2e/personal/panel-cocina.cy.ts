describe('Panel de cocina', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'COCINERO', userId: 'cocinero-1' });
  });

  it('muestra las órdenes en cola', () => {
    cy.intercept('GET', '**/api/pedidos/cocina/tablero*', [
      {
        id: 'ord-1',
        estado: 'PAGO_VALIDADO',
        createdAt: new Date().toISOString(),
        clienteNombre: 'Ana Pérez',
        lineas: [
          {
            productoMongoId: 'p1',
            productoNombre: 'Lomo Saltado',
            cantidad: 1,
            ingredientes: [{ nombre: 'Papa', cantidad: 100, unidad: 'GR' }],
          },
        ],
      },
    ]).as('tablero');
    cy.visit('/cocina');
    cy.wait('@tablero');
    cy.contains('En Cola').should('be.visible');
    cy.contains('Lomo Saltado').should('be.visible');
  });

  it('marca una orden en preparación como lista', () => {
    cy.intercept('GET', '**/api/pedidos/cocina/tablero*', [
      {
        id: 'ord-1',
        estado: 'EN_COCINA',
        createdAt: new Date().toISOString(),
        clienteNombre: 'Ana Pérez',
        lineas: [{ productoMongoId: 'p1', productoNombre: 'Lomo Saltado', cantidad: 1, ingredientes: [] }],
      },
    ]).as('tablero');
    cy.visit('/cocina');
    cy.wait('@tablero');
    cy.contains('En Preparación').should('be.visible');
    cy.contains('Lomo Saltado').should('be.visible');
  });
});