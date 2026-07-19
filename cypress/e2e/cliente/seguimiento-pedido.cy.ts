describe('Seguimiento de pedido', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1' });
  });

  it('muestra un pedido pendiente y su progreso', () => {
    cy.intercept('GET', '**/api/pedidos/seguimiento/listas*', {
      pendientes: [
        {
          orderId: 'ord-1',
          estado: 'EN_COCINA',
          createdAt: '2026-01-01T10:00:00',
          total: '35.00',
          cancelReason: '',
          repartidorNombre: '',
          isRated: false,
          lineas: [
            {
              nombreProducto: 'Lomo Saltado',
              cantidad: 1,
              precioUnitario: '25.00',
              subtotal: '25.00',
            },
          ],
        },
      ],
      finalizados: [],
    }).as('listas');
    cy.visit('/seguimiento-pedido');
    cy.wait('@listas');
    cy.contains('#ord-1'.slice(0, 6)).should('exist');
    cy.contains('EN_COCINA').should('be.visible');
  });

  it('permite calificar un pedido entregado sin calificar', () => {
    cy.intercept('GET', '**/api/pedidos/seguimiento/listas*', {
      pendientes: [],
      finalizados: [
        {
          orderId: 'ord-2',
          estado: 'ENTREGADO',
          createdAt: '2026-01-01T10:00:00',
          total: '35.00',
          cancelReason: '',
          repartidorNombre: 'Carlos',
          isRated: false,
          lineas: [],
        },
      ],
    }).as('listas');
    cy.intercept('POST', '**/api/pedidos/calificacion', { ok: true }).as('calificar');
    cy.visit('/seguimiento-pedido');
    cy.wait('@listas');
    cy.contains('button', 'Calificar Servicio').click();
    cy.get('.rb-modal button[aria-pressed]').eq(4).click({ force: true });
    cy.contains('button', 'Enviar Calificación').click({ force: true });
    cy.wait('@calificar');
  });

  it('muestra el motivo de cancelación', () => {
    cy.intercept('GET', '**/api/pedidos/seguimiento/listas*', {
      pendientes: [],
      finalizados: [
        {
          orderId: 'ord-3',
          estado: 'CANCELADO',
          createdAt: '2026-01-01T10:00:00',
          total: '35.00',
          cancelReason: 'El comprobante no coincide con el monto.',
          repartidorNombre: '',
          isRated: false,
          lineas: [],
        },
      ],
    }).as('listas');
    cy.visit('/seguimiento-pedido');
    cy.wait('@listas');
    cy.contains('Pago rechazado').should('be.visible');
    cy.contains('El comprobante no coincide con el monto.').should('be.visible');
  });
});
