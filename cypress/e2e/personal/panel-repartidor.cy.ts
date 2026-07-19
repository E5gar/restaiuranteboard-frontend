describe('Panel de repartidor', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'REPARTIDOR', userId: 'repartidor-1' });
  });

  it('lista órdenes disponibles para asumir', () => {
    cy.intercept('GET', '**/api/pedidos/repartidor/tablero*', [
      {
        id: 'ord-1',
        status: 'PREPARADO',
        createdAt: new Date().toISOString(),
        listoAt: new Date().toISOString(),
        deliveredAt: '',
        clienteNombre: 'Ana Pérez',
        direccionEntrega: 'Av. Lima 123',
        deliveryPersonId: '',
      },
    ]).as('tablero');
    cy.visit('/entregas');
    cy.wait('@tablero');
    cy.contains('Av. Lima 123').should('be.visible');
    cy.contains('button', 'Asumir orden').should('be.visible');
  });

  it('asume una orden disponible', () => {
    cy.intercept('GET', '**/api/pedidos/repartidor/tablero*', [
      {
        id: 'ord-1',
        status: 'PREPARADO',
        createdAt: new Date().toISOString(),
        listoAt: new Date().toISOString(),
        deliveredAt: '',
        clienteNombre: 'Ana Pérez',
        direccionEntrega: 'Av. Lima 123',
        deliveryPersonId: '',
      },
    ]).as('tablero');
    cy.intercept('POST', '**/api/pedidos/repartidor/ord-1/asumir', { ok: true }).as('asumir');
    cy.visit('/entregas');
    cy.wait('@tablero');
    cy.contains('button', 'Asumir orden').click();
    cy.wait('@asumir');
  });

  it('confirma la entrega con imagen', () => {
    cy.intercept('GET', '**/api/pedidos/repartidor/tablero*', [
      {
        id: 'ord-1',
        status: 'EN_CAMINO',
        createdAt: new Date().toISOString(),
        listoAt: new Date().toISOString(),
        deliveredAt: '',
        clienteNombre: 'Ana Pérez',
        direccionEntrega: 'Av. Lima 123',
        deliveryPersonId: 'repartidor-1',
      },
    ]).as('tablero');
    cy.intercept('POST', '**/api/pedidos/repartidor/ord-1/entregar', { ok: true }).as('entregar');
    cy.visit('/entregas');
    cy.wait('@tablero');
    cy.contains('button', 'En Camino').click();
    cy.contains('button', 'Entregado').click();
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('img'), fileName: 'entrega.png', mimeType: 'image/png' },
      { force: true },
    );
    cy.contains('button', 'Confirmar entrega').click();
    cy.wait('@entregar');
    cy.contains('¡Excelente trabajo!').should('be.visible');
  });
});