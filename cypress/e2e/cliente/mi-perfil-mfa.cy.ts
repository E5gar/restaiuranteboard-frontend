describe('Mi Perfil - Autenticación de doble factor (MFA)', () => {
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
  it('muestra el estado inactivo del doble factor', () => {
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.contains('Inactivo').should('be.visible');
    cy.contains('button', 'Activar autenticación de doble factor').should('be.visible');
  });
  it('inicia la configuración de MFA y muestra el QR', () => {
    cy.intercept('POST', '**/api/perfil/me/mfa/iniciar', {
      otpAuthUri:
        'otpauth://totp/Restaiuranteboard:cliente@gmail.com?secret=ABC123&issuer=Restaiuranteboard',
      secretPlain: 'ABC123',
      email: 'cliente@gmail.com',
    }).as('iniciarMfa');
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.contains('button', 'Activar autenticación de doble factor').click();
    cy.wait('@iniciarMfa');
    cy.get('input[readonly].font-mono').should('have.value', 'ABC123');
  });
  it('confirma la activación de MFA y muestra códigos de respaldo', () => {
    cy.intercept('POST', '**/api/perfil/me/mfa/iniciar', {
      otpAuthUri: 'otpauth://totp/test?secret=ABC123&issuer=Restaiuranteboard',
      secretPlain: 'ABC123',
      email: 'cliente@gmail.com',
    }).as('iniciarMfa');
    cy.intercept('POST', '**/api/perfil/me/mfa/confirmar', {
      message: 'Autenticación de doble factor activada.',
      mfaEnabled: true,
      backupCodes: ['AAAA-1111', 'BBBB-2222'],
    }).as('confirmarMfa');
    cy.visit('/mi-perfil');
    cy.wait('@perfil');
    cy.contains('button', 'Activar autenticación de doble factor').click();
    cy.wait('@iniciarMfa');
    cy.get('input[inputmode="numeric"]').last().type('123456');
    cy.contains('button', 'Confirmar activación').click();
    cy.wait('@confirmarMfa');
    cy.contains('AAAA-1111').should('be.visible');
    cy.contains('BBBB-2222').should('be.visible');
  });
  it('desactiva MFA con contraseña y código válidos', () => {
    cy.intercept('GET', '**/api/perfil/me', {
      userId: 'cliente-1',
      fullName: 'Ana Pérez',
      phone: '912345678',
      address: 'Av. Lima 123',
      dni: '12345678',
      email: 'cliente@gmail.com',
      role: 'CLIENTE',
      canEditAddress: true,
      mfaEnabled: true,
      hasLocalPassword: true,
    }).as('perfilMfaActivo');
    cy.intercept('POST', '**/api/perfil/me/mfa/desactivar', {
      message: 'Autenticación de doble factor desactivada.',
      mfaEnabled: false,
    }).as('desactivarMfa');
    cy.visit('/mi-perfil');
    cy.wait('@perfilMfaActivo');
    cy.contains('button', 'Desactivar doble factor').click();
    cy.get('input[name="mfaDisablePassword"]').type('Secret1@');
    cy.get('input[name="mfaDisableCode"]').type('123456');
    cy.contains('button', 'Confirmar desactivación').click();
    cy.wait('@desactivarMfa');
  });
});
