describe('Atención al cliente', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1' });
    cy.intercept('GET', '**/api/soporte/cliente/pedidos-recientes', [
      { orderId: 'ord-1', label: '#123456 | 2026-01-01 10:00 | S/ 35.00 | ENTREGADO', status: 'ENTREGADO', total: 35, createdAt: '2026-01-01T10:00:00' },
    ]).as('pedidos');
  });

  it('exige seleccionar un pedido para avanzar', () => {
    cy.visit('/atencion-cliente');
    cy.wait('@pedidos');
    cy.contains('button', 'Siguiente').click();
    cy.contains('Selecciona un pedido.').should('be.visible');
  });

  it('completa el flujo y envía el reporte', () => {
    cy.intercept('POST', '**/api/soporte/cliente/tickets', {
      ticketId: 't1',
      ticketCode: '#TIAT-00001',
      status: 'PENDIENTE',
    }).as('crearTicket');
    cy.visit('/atencion-cliente');
    cy.wait('@pedidos');
    cy.get('select').first().select('ord-1');
    cy.contains('button', 'Siguiente').click();
    cy.get('select').first().select('PEDIDO_INCOMPLETO'); 
    cy.contains('button', 'Siguiente').click();
    cy.get('#desc-problema').type('Faltó una bebida en el pedido.');
    cy.contains('button', 'Enviar reporte').click();
    cy.wait('@crearTicket');
    cy.contains('Reporte enviado').should('be.visible');
    cy.contains('#TIAT-00001').should('be.visible');
  });
});