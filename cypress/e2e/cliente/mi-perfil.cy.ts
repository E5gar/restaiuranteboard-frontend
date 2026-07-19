describe('Mi perfil', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1', email: 'cliente@gmail.com' });
    cy.intercept('GET', '**/api/perfil/me', {
      userId: 'cliente-1',
      fullName: 'Ana Pérez',
      phone: '912345678',
      address: 'Av. Lima 123',
      dni: '12345678',
      email: 'cliente@gmail.com',
      role: 'CLIENTE',
      canEditAddress: true,
      mfaEnabled: false,
      hasLocalPassword: true,
    }).as('perfil');
  });

  it('carga los datos del perfil', () => {
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.get('input[name="fullName"]').should('have.value', 'Ana Pérez');
  });

  it('actualiza los datos del perfil', () => {
    cy.intercept('PUT', '**/api/perfil/me', {
      userId: 'cliente-1',
      fullName: 'Ana Pérez Gómez',
      phone: '987654321',
      address: 'Av. Lima 456',
      dni: '12345678',
      email: 'cliente@gmail.com',
      role: 'CLIENTE',
      canEditAddress: true,
    }).as('actualizar');
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.get('input[name="fullName"]').clear().type('Ana Pérez Gómez');
    cy.get('input[name="phone"]').clear().type('987654321');
    cy.get('input[name="address"]').clear().type('Av. Lima 456');
    cy.contains('button', 'Guardar Cambios').click();
    cy.wait('@actualizar');
    cy.contains('Tus datos han sido actualizados correctamente').should('be.visible');
  });

  it('abre el modal de eliminación de cuenta', () => {
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.contains('button', 'Eliminar mi cuenta').click();
    cy.contains('Eliminar cuenta').should('be.visible');
    cy.contains('Esta acción es irreversible').should('be.visible');
  });

  it('elimina la cuenta con contraseña válida', () => {
    cy.intercept('POST', '**/api/perfil/me/eliminar-cuenta', { message: 'ok' }).as('eliminar');
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.contains('button', 'Eliminar mi cuenta').click();
    cy.get('input[name="passwordEliminar"]').type('Secret1@');
    cy.contains('button', 'Confirmar eliminación').click();
    cy.wait('@eliminar');
    cy.url().should('include', '/presentacion');
  });
});