describe('Soporte al cliente (admin)', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/soporte/admin/tickets', [
      {
        id: 't1',
        ticketCode: '#TIAT-00001',
        clientName: 'Ana Pérez',
        clientEmail: 'ana@gmail.com',
        orderId: 'ord-1',
        orderResumen: '#123456 | 01/01/2026 | ENTREGADO',
        categoria: 'PEDIDO_INCOMPLETO',
        categoriaLabel: 'Pedido incompleto',
        descripcion: 'Faltó una bebida.',
        tieneEvidencia: false,
        status: 'PENDIENTE',
      },
    ]).as('tickets');
  });

  it('lista los tickets pendientes', () => {
    cy.visit('/admin-soporte');
    cy.wait('@tickets');
    cy.contains('#TIAT-00001').should('be.visible');
    cy.contains('PENDIENTE').should('be.visible');
  });

  it('cierra un ticket con justificación', () => {
    cy.intercept('POST', '**/api/soporte/admin/tickets/t1/cerrar', {
      id: 't1',
      status: 'CERRADO',
      cierreMensaje: 'Se reembolsó el monto correspondiente.',
    }).as('cerrar');
    cy.visit('/admin-soporte');
    cy.wait('@tickets');
    cy.contains('button', 'Cerrar ticket').click();
    cy.get('textarea').type('Se reembolsó el monto correspondiente.');
    cy.contains('button', 'Confirmar cierre').click();
    cy.wait('@cerrar');
  });

  it('exige justificación antes de cerrar', () => {
    cy.visit('/admin-soporte');
    cy.wait('@tickets');
    cy.contains('button', 'Cerrar ticket').click();
    cy.contains('button', 'Confirmar cierre').click();
    cy.contains('Escribe la justificacion del cierre.').should('be.visible');
  });
});