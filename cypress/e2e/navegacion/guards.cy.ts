describe('Guards de navegación', () => {
  it('redirige a /setup cuando la configuración no está completa', () => {
    cy.mockGuards({ configuracionCompleta: false });
    cy.visit('/presentacion');
    cy.url().should('include', '/setup');
  });

  it('redirige a /retenido cuando la IP está bloqueada', () => {
    cy.mockGuards({ ipBlocked: true });
    cy.intercept('GET', '**/api/auth/ip-status', {
      blocked: true,
      ipAddress: '127.0.0.1',
      remainingSeconds: 900,
    }).as('ipStatus');
    cy.visit('/presentacion');
    cy.wait('@ipStatus');
    cy.url().should('include', '/retenido');
  });

  it('redirige a /login al intentar acceder a una ruta protegida sin sesión', () => {
    cy.mockGuards();
    cy.visit('/gestion-administrador');
    cy.url().should('include', '/login');
  });

  it('redirige a un cliente autenticado fuera de /gestion-administrador (solo ADMIN)', () => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1' });
    cy.intercept('GET', '**/api/catalogo/productos/menu/base', { productos: [] }).as('menuBase');
    cy.intercept('GET', '**/api/catalogo/productos/menu/recomendaciones*', {
      recommendedProductIds: [],
      showRecommendations: false,
      highlightedProducts: [],
    }).as('recs');
    cy.visit('/gestion-administrador');
    cy.url().should('include', '/menu');
  });

  it('redirige a /confirmar-cuenta cuando firstLogin es true', () => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1', firstLogin: true, email: 'cliente@gmail.com' });
    cy.visit('/checkout');
    cy.url().should('include', '/confirmar-cuenta');
  });
});