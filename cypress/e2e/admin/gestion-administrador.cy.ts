describe('Panel de gestión administrador', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
  });

  it('muestra los accesos principales del panel', () => {
    cy.visit('/gestion-administrador');
    cy.contains('Dashboard y KPIs').should('be.visible');
    cy.contains('Crear Cuenta para Personal').should('be.visible');
    cy.contains('Ingredientes y Productos').should('be.visible');
    cy.contains('Información del Negocio').should('be.visible');
    cy.contains('Configuración de Modelos de IA').should('be.visible');
    cy.contains('Respaldos de Bases de Datos').should('be.visible');
  });

  it('navega al dashboard', () => {
    cy.intercept('GET', '**/api/admin/dashboard/rango-fechas*', {
      fechaMinima: '2026-01-01',
      fechaMaxima: '2026-01-31',
    }).as('rango');
    cy.intercept('GET', '**/api/admin/dashboard/ventas-pedidos*', { kpis: {} }).as('ventas');
    cy.intercept('GET', '**/api/ia-modelos/publico', { slot3Activo: false }).as('iaPublico');
    cy.visit('/gestion-administrador');
    cy.contains('Dashboard y KPIs').click();
    cy.url().should('include', '/dashboard');
  });
});