describe('Recuperar contraseña', () => {
  beforeEach(() => {
    cy.mockGuards();
  });

  it('rechaza correos con dominio no permitido', () => {
    cy.visit('/recuperar');
    cy.get('input[name="email"]').type('user@proton.me');
    cy.contains('button', 'Enviar Código').click();
    cy.contains('Solo se permiten dominios').should('be.visible');
  });

  it('envía el código y avanza al paso 2', () => {
    cy.intercept('POST', '**/api/auth/enviar-codigo-recuperacion', {}).as('enviar');
    cy.visit('/recuperar');
    cy.get('input[name="email"]').type('usuario@gmail.com');
    cy.contains('button', 'Enviar Código').click();
    cy.wait('@enviar');
    cy.contains('Código Enviado').should('be.visible');
    cy.contains('button', 'Entendido').click();
    cy.get('input[name="npw"]').should('be.visible');
  });

  it('valida contraseña débil en el paso 2', () => {
    cy.intercept('POST', '**/api/auth/enviar-codigo-recuperacion', {}).as('enviar');
    cy.visit('/recuperar');
    cy.get('input[name="email"]').type('usuario@gmail.com');
    cy.contains('button', 'Enviar Código').click();
    cy.wait('@enviar');
    cy.contains('button', 'Entendido').click();
    cy.get('input[inputmode="numeric"]').first().type('123456');
    cy.get('input[name="npw"]').type('123');
    cy.get('input[name="cpw"]').type('123');
    cy.contains('button', 'Cambiar Contraseña').click();
    cy.contains('Contraseña Débil').should('be.visible');
  });

  it('restablece la contraseña con datos válidos', () => {
    cy.intercept('POST', '**/api/auth/enviar-codigo-recuperacion', {}).as('enviar');
    cy.intercept('POST', '**/api/auth/reset-password', {}).as('reset');
    cy.visit('/recuperar');
    cy.get('input[name="email"]').type('usuario@gmail.com');
    cy.contains('button', 'Enviar Código').click();
    cy.wait('@enviar');
    cy.contains('button', 'Entendido').click();
    cy.get('input[name="npw"]').type('Abcdef1@');
    cy.get('input[name="cpw"]').type('Abcdef1@');
    cy.get('input[inputmode="numeric"]').first().type('123456');
    cy.contains('button', 'Cambiar Contraseña').click();
    cy.wait('@reset');
    cy.contains('¡Éxito!').should('be.visible');
  });
});
