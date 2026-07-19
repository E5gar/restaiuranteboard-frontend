describe('Dashboard - Exportación en Excel y flujo de error', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-uuid-123' });
    cy.intercept('GET', '**/api/chat/admin/sesion', { statusCode: 200, body: {} }).as('chatSesion');
    cy.intercept('GET', '**/api/ia-modelos/publico', { slot3Activo: false }).as('iaPublico');
    cy.intercept('GET', '**/api/admin/dashboard/rango-fechas*', {
      statusCode: 200,
      body: { fechaMinima: '2025-01-01', fechaMaxima: '2026-12-31' },
    }).as('rango');
    cy.intercept('GET', '**/api/admin/dashboard/ventas-pedidos*', {
      statusCode: 200,
      body: { kpis: {} },
    }).as('ventas');
  });

  it('exporta el reporte en formato Excel', () => {
    cy.intercept('POST', '**/api/admin/dashboard/export/solicitar', {
      jobId: 'job-2',
      fileName: 'reporte_dashboard_ventas.xlsx',
      tabLabel: 'Ventas y Pedidos',
      message: 'Generando reporte...',
    }).as('solicitar');
    cy.intercept('GET', '**/api/admin/dashboard/export/jobs/job-2', {
      status: 'READY',
      downloadUrl: 'https://example.com/reporte.xlsx',
      fileName: 'reporte_dashboard_ventas.xlsx',
      tabLabel: 'Ventas y Pedidos',
    }).as('estadoJob');
    cy.visit('/dashboard');
    cy.wait(['@rango', '@ventas']);
    cy.contains('button', 'Exportar').click();
    cy.contains('button', 'Excel').click();
    cy.contains('button', 'Generar reporte').click();
    cy.wait('@solicitar').its('request.body.format').should('eq', 'EXCEL');
    cy.wait('@estadoJob');
    cy.contains('Reporte generado').should('be.visible');
    cy.contains('a', 'Haz clic aquí para descargar').should(
      'have.attr',
      'href',
      'https://example.com/reporte.xlsx',
    );
  });

  it('muestra error cuando la generación del reporte falla', () => {
    cy.intercept('POST', '**/api/admin/dashboard/export/solicitar', {
      jobId: 'job-3',
      fileName: 'reporte_dashboard_ventas.pdf',
      tabLabel: 'Ventas y Pedidos',
      message: 'Generando reporte...',
    }).as('solicitar');
    cy.intercept('GET', '**/api/admin/dashboard/export/jobs/job-3', {
      status: 'FAILED',
      message: 'La generación del reporte falló en GitHub Actions.',
      fileName: 'reporte_dashboard_ventas.pdf',
      tabLabel: 'Ventas y Pedidos',
    }).as('estadoJob');
    cy.visit('/dashboard');
    cy.wait(['@rango', '@ventas']);
    cy.contains('button', 'Exportar').click();
    cy.contains('button', 'Generar reporte').click();
    cy.wait('@solicitar');
    cy.wait('@estadoJob');
    cy.contains('Error en reporte').should('be.visible');
    cy.contains('La generación del reporte falló').should('be.visible');
  });

  it('deshabilita el botón de generar cuando no hay ninguna opción marcada', () => {
    cy.visit('/dashboard');
    cy.wait(['@rango', '@ventas']);
    cy.contains('button', 'Exportar').click();
    cy.get('input[type="checkbox"]').uncheck({ force: true });
    cy.contains('button', 'Generar reporte').should('be.disabled');
  });

  it('aplica filtro de rango de fechas y recarga ventas', () => {
    cy.visit('/dashboard');
    cy.wait(['@rango', '@ventas']);
    cy.intercept('GET', '**/api/admin/dashboard/ventas-pedidos*', { kpis: { numPedidos: 5 } }).as(
      'ventasFiltradas',
    );
    cy.contains('button', 'Aplicar rango').click();
    cy.wait('@ventasFiltradas');
  });

  it('usa el botón "Desde el Inicio" para ajustar la fecha mínima', () => {
    cy.visit('/dashboard');
    cy.wait(['@rango', '@ventas']);
    cy.intercept('GET', '**/api/admin/dashboard/ventas-pedidos*', { kpis: {} }).as(
      'ventasDesdeInicio',
    );
    cy.contains('button', 'Desde el Inicio').click();
    cy.wait('@ventasDesdeInicio');
  });
});
