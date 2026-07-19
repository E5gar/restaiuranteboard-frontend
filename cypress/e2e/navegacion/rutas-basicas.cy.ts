describe('Rutas básicas y redirecciones', () => {
  it('redirige raíz a /presentacion cuando la configuración está completa', () => {
    cy.mockGuards({ configuracionCompleta: true });
    cy.visit('/');
    cy.url().should('include', '/presentacion');
  });
  it('la página de mantenimiento se muestra directamente', () => {
    cy.visit('/mantenimiento');
    cy.contains('En mantenimiento').should('be.visible');
  });
  it('ruta desconocida redirige a inicio', () => {
    cy.mockGuards({ configuracionCompleta: true });
    cy.visit('/ruta-que-no-existe');
    cy.url().should('include', '/presentacion');
  });
  it('la vista de retenido consulta el estado de IP y muestra el conteo regresivo', () => {
    cy.intercept('GET', '**/api/auth/ip-status', {
      blocked: true,
      ipAddress: '127.0.0.1',
      remainingSeconds: 5,
    }).as('ipStatus');
    cy.visit('/retenido');
    cy.wait('@ipStatus');
    cy.contains('Acceso retenido temporalmente').should('be.visible');
    cy.contains('127.0.0.1').should('be.visible');
  });
});