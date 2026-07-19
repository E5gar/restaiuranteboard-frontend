describe('Modelos IA - Dataset y Slot 2/3', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/ia-modelos', {
      iaActiva: true,
      slots: [
        { slotNumber: 1, titulo: 'Slot 1: Menú Principal', status: 'ACTIVO', slotEnabled: true, modelFileName: 'modelo.keras', uploadedAt: '2026-01-01T10:00:00' },
        { slotNumber: 2, titulo: 'Slot 2: Venta Cruzada para Carrito', status: 'VACIO', slotEnabled: false },
        { slotNumber: 3, titulo: 'Slot 3: Predicción de Inventario', status: 'VACIO', slotEnabled: false },
      ],
    }).as('config');
  });
  it('solicita el dataset del Slot 1 y muestra el enlace de descarga', () => {
    cy.intercept('POST', '**/api/ia-modelos/dataset/1/solicitar', {
      jobId: 'ds-1',
      fileName: 'dataset_modelo_01.zip',
      message: 'Generando dataset...',
    }).as('solicitarDataset');
    cy.intercept('GET', '**/api/ia-modelos/dataset/jobs/ds-1', {
      status: 'READY',
      slot: 1,
      fileName: 'dataset_modelo_01.zip',
      downloadUrl: 'https://example.com/dataset01.zip',
    }).as('estadoDataset');
    cy.visit('/admin-modelos-ia');
    cy.wait('@config');
    cy.contains('article', 'Slot 1: Menú Principal').within(() => {
      cy.contains('button', 'Descargar dataset de entrenamiento').click();
    });
    cy.wait('@solicitarDataset');
    cy.wait('@estadoDataset');
    cy.contains('Dataset generado').should('be.visible');
  });
  it('exige los 3 archivos JSON para el Slot 2', () => {
    cy.visit('/admin-modelos-ia');
    cy.wait('@config');
    cy.contains('article', 'Slot 2: Venta Cruzada para Carrito').within(() => {
      cy.contains('button', 'Subir paquete Slot 2').click();
    });
    cy.contains('Archivos requeridos').should('be.visible');
    cy.contains('rules.json, frequency.json y config.json').should('be.visible');
  });
  it('rechaza extensión incorrecta en archivo del Slot 2', () => {
    cy.visit('/admin-modelos-ia');
    cy.wait('@config');
    cy.contains('article', 'Slot 2: Venta Cruzada para Carrito').within(() => {
      cy.get('input[type="file"]').first().selectFile(
        { contents: Cypress.Buffer.from('{}'), fileName: 'rules.txt', mimeType: 'text/plain' },
        { force: true },
      );
    });
    cy.contains('Archivo inválido').should('be.visible');
  });
  it('exige los 4 archivos del Slot 3', () => {
    cy.visit('/admin-modelos-ia');
    cy.wait('@config');
    cy.contains('article', 'Slot 3: Predicción de Inventario').within(() => {
      cy.contains('button', 'Subir paquete Slot 3').click();
    });
    cy.contains('Debes cargar los cuatro archivos del Slot 3.').should('be.visible');
  });
  it('activa/desactiva un slot individual mediante switch', () => {
    cy.intercept('PATCH', '**/api/ia-modelos/slot/1/toggle', {
      iaActiva: true,
      slots: [{ slotNumber: 1, titulo: 'Slot 1: Menú Principal', status: 'ACTIVO', slotEnabled: false }],
    }).as('toggleSlot');
    cy.visit('/admin-modelos-ia');
    cy.wait('@config');
    cy.contains('article', 'Slot 1: Menú Principal').find('input[type="checkbox"]').last().uncheck({ force: true });
    cy.wait('@toggleSlot');
  });
});