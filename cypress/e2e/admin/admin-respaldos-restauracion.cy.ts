describe('Respaldos - Generación y restauración conjunta', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1', email: 'admin@gmail.com' });
    cy.intercept('GET', '**/api/admin/backups/automation', {
      enabled: false,
      frequency: 'DAILY',
      timeHHmm: '03:00',
      notifyEmailAfterFinish: false,
      nextBackupSummary: 'Copia automática desactivada.',
      lastAttemptStatus: 'SUCCESS',
      lastAttemptAt: '2026-01-01T03:00:00Z',
      lastWorkflowStatus: 'SUCCESS',
      lastWorkflowAt: '2026-01-01T03:05:00Z',
      lastWorkflowDetail: null,
    }).as('automation');
  });
  it('lista respaldos conjuntos emparejados por fecha', () => {
    cy.intercept('GET', '**/api/admin/backups/list*', (req) => {
      const db = req.url.includes('db=postgresql') ? 'postgresql' : 'mongodb';
      req.reply({
        body: [
          {
            key: `backup_${db}_20260101_0300.dump.enc`,
            sizeBytes: 1024,
            lastModified: '2026-01-01T03:00:00',
          },
        ],
      });
    }).as('list');
    cy.visit('/admin-respaldos');
    cy.wait('@automation');
    cy.wait(['@list', '@list']);
    cy.contains('20260101_0300').should('be.visible');
  });
  it('muestra el estado del último intento (exitoso)', () => {
    cy.intercept('GET', '**/api/admin/backups/list*', []).as('list');
    cy.visit('/admin-respaldos');
    cy.wait('@automation');
    cy.contains('Exitoso').should('be.visible');
  });
  it('inicia el flujo de restauración y solicita confirmación de mantenimiento', () => {
    cy.intercept('GET', '**/api/admin/backups/list*', (req) => {
      const db = req.url.includes('db=postgresql') ? 'postgresql' : 'mongodb';
      req.reply({
        body: [{ key: `backup_${db}_20260101_0300.dump.enc`, sizeBytes: 1024, lastModified: '2026-01-01T03:00:00' }],
      });
    }).as('list');
    cy.intercept('POST', '**/api/admin/backups/restore-pair', { ok: true }).as('restorePair');
    cy.visit('/admin-respaldos');
    cy.wait('@automation');
    cy.wait(['@list', '@list']);
    cy.contains('button', 'Restaurar').click();
    cy.contains('Confirmar restauración').should('be.visible');
    cy.contains('button', 'Confirmar').click();
    cy.wait('@restorePair');
    cy.contains('Restaurando bases de datos...').should('be.visible');
  });
  it('elimina un respaldo conjunto tras confirmación', () => {
    cy.intercept('GET', '**/api/admin/backups/list*', (req) => {
      const db = req.url.includes('db=postgresql') ? 'postgresql' : 'mongodb';
      req.reply({
        body: [{ key: `backup_${db}_20260101_0300.dump.enc`, sizeBytes: 1024, lastModified: '2026-01-01T03:00:00' }],
      });
    }).as('list');
    cy.intercept('DELETE', '**/api/admin/backups/delete*', { ok: true }).as('delete');
    cy.visit('/admin-respaldos');
    cy.wait('@automation');
    cy.wait(['@list', '@list']);
    cy.contains('button', 'Eliminar').click();
    cy.contains('button', 'Confirmar').click();
    cy.wait(['@delete', '@delete']);
    cy.contains('Eliminado').should('be.visible');
  });
});