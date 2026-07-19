describe('Respaldos de bases de datos', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/admin/backups/automation', {
      enabled: false,
      frequency: 'DAILY',
      timeHHmm: '03:00',
      notifyEmailAfterFinish: false,
      nextBackupSummary: 'Copia automática desactivada.',
      lastAttemptStatus: 'NONE',
      lastAttemptAt: null,
      lastWorkflowStatus: null,
      lastWorkflowAt: null,
      lastWorkflowDetail: null,
    }).as('automation');
    cy.intercept('GET', '**/api/admin/backups/list*', []).as('list');
  });

  it('carga la sección de respaldos', () => {
    cy.visit('/admin-respaldos');
    cy.wait(['@automation', '@list']);
    cy.contains('Respaldos de Bases de Datos').should('be.visible');
    cy.contains('No hay respaldos conjuntos disponibles.').should('be.visible');
  });

  it('guarda la configuración de backup automático', () => {
    cy.intercept('PUT', '**/api/admin/backups/automation', {
      enabled: true,
      frequency: 'WEEKLY',
      timeHHmm: '04:00',
      notifyEmailAfterFinish: true,
      nextBackupSummary: 'Programado para el lunes.',
      lastAttemptStatus: 'NONE',
    }).as('guardar');
    cy.visit('/admin-respaldos');
    cy.wait(['@automation', '@list']);
    cy.get('input[name="autoEnabled"]').check({ force: true });
    cy.get('select[name="autoFrequency"]').select('WEEKLY');
    cy.contains('button', 'Guardar configuración').click();
    cy.wait('@guardar');
    cy.contains('Configuración guardada').should('be.visible');
  });
});