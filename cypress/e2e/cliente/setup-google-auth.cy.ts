describe('Autenticación con Google (login y registro)', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.intercept('GET', '**/api/configuracion', {
      configuracionCompleta: true,
      nombreNegocio: 'Restaiuranteboard',
    }).as('config');
  });
  it('no muestra el botón de Google si no está configurado (googleClientId vacío)', () => {
    cy.visit('/login');
    cy.wait('@config');
    // Dado que environment.googleClientId está vacío en desarrollo, el botón no debe existir.
    cy.contains('button', 'Iniciar sesión con Google').should('not.exist');
  });
  it('el registro también oculta el botón de Google cuando no está configurado', () => {
    cy.intercept('GET', '**/api/auth/check-admin', { hasAdmin: true }).as('checkAdmin');
    cy.visit('/registro');
    cy.wait(['@config', '@checkAdmin']);
    cy.contains('button', 'Registrarse con Google').should('not.exist');
  });
});