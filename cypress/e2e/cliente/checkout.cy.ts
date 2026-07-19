describe('Checkout', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1' });
    cy.intercept('GET', '**/api/carrito*', {
      items: [{ productId: 'p1', name: 'Lomo Saltado', unitPrice: 25, quantity: 1, thumbSrc: '' }],
    }).as('carrito');
    cy.intercept('GET', '**/api/configuracion', {
      configuracionCompleta: true,
      mediosPago: {
        yapeActivo: true,
        yapeTelefono: '912345678',
        plinActivo: false,
        plinTelefono: '',
        transferenciaActiva: false,
        transferencias: [],
      },
    }).as('config');
  });

  it('muestra el resumen y los medios de pago', () => {
    cy.visit('/checkout');
    cy.wait('@carrito');
    cy.wait('@config');
    cy.contains('Finalizar Pedido').should('be.visible');
    cy.contains('Yape').should('be.visible');
  });

  it('exige el comprobante antes de confirmar', () => {
    cy.visit('/checkout');
    cy.wait('@carrito');
    cy.contains('button', 'Confirmar y Enviar Pedido').should('be.disabled');
  });

  it('rechaza archivos con formato no permitido', () => {
    cy.visit('/checkout');
    cy.wait('@carrito');
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('doc'), fileName: 'doc.pdf', mimeType: 'application/pdf' },
      { force: true },
    );
    cy.contains('Formato no admitido').should('be.visible');
  });

  it('envía el pedido con comprobante válido', () => {
    cy.intercept('POST', '**/api/pedidos/checkout', { orderId: 'order-1' }).as('checkout');
    cy.visit('/checkout');
    cy.wait('@carrito');
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from('fake-image'), fileName: 'comprobante.png', mimeType: 'image/png' },
      { force: true },
    );
    cy.contains('button', 'Confirmar y Enviar Pedido').click();
    cy.wait('@checkout');
    cy.url().should('include', '/pedido-enviado');
  });
});