describe('Panel de caja', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CAJERO', userId: 'cajero-1' });
  });

  it('lista los pagos por validar', () => {
    cy.intercept('GET', '**/api/pedidos/caja/pendientes*', [
      { id: 'ord-1', createdAt: '2026-01-01T10:00:00', clienteNombre: 'Ana Pérez', total: '35.00' },
    ]).as('pendientes');
    cy.visit('/caja');
    cy.wait('@pendientes');
    cy.contains('Ana Pérez').should('be.visible');
  });

  it('valida un pago exitosamente', () => {
    cy.intercept('GET', '**/api/pedidos/caja/pendientes*', [
      { id: 'ord-1', createdAt: '2026-01-01T10:00:00', clienteNombre: 'Ana Pérez', total: '35.00' },
    ]).as('pendientes');
    cy.intercept('GET', '**/api/pedidos/caja/ord-1*', {
      id: 'ord-1',
      createdAt: '2026-01-01T10:00:00',
      estado: 'VALIDANDO_PAGO',
      total: '35.00',
      clienteNombres: 'Ana',
      clienteApellidos: 'Pérez',
      clienteEmail: 'ana@gmail.com',
      clienteTelefono: '912345678',
      direccionEntrega: 'Av. Lima 123',
      lineas: [],
      comprobanteDataUrl: '',
    }).as('detalle');
    cy.intercept('POST', '**/api/pedidos/caja/ord-1/validar', { ok: true }).as('validar');
    cy.visit('/caja');
    cy.wait('@pendientes');
    cy.contains('tr', 'Ana Pérez').click();
    cy.wait('@detalle');
    cy.contains('button', 'Validar pago').click();
    cy.contains('button', 'Confirmar').click();
    cy.wait('@validar');
  });

  it('rechaza un pago con motivo', () => {
    cy.intercept('GET', '**/api/pedidos/caja/pendientes*', [
      { id: 'ord-1', createdAt: '2026-01-01T10:00:00', clienteNombre: 'Ana Pérez', total: '35.00' },
    ]).as('pendientes');
    cy.intercept('GET', '**/api/pedidos/caja/ord-1*', {
      id: 'ord-1',
      createdAt: '2026-01-01T10:00:00',
      estado: 'VALIDANDO_PAGO',
      total: '35.00',
      clienteNombres: 'Ana',
      clienteApellidos: 'Pérez',
      clienteEmail: 'ana@gmail.com',
      clienteTelefono: '912345678',
      direccionEntrega: 'Av. Lima 123',
      lineas: [],
      comprobanteDataUrl: '',
    }).as('detalle');
    cy.intercept('POST', '**/api/pedidos/caja/ord-1/rechazar', { ok: true }).as('rechazar');
    cy.visit('/caja');
    cy.wait('@pendientes');
    cy.contains('tr', 'Ana Pérez').click();
    cy.wait('@detalle');
    cy.contains('button', 'Rechazar pago').click();
    cy.get('#motivo-rechazo-caja').type('El monto no coincide.');
    cy.get('.rb-modal').contains('button', 'Rechazar pago').click(); 
    cy.wait('@rechazar');
  });
});