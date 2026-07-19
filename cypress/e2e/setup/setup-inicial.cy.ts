describe('Setup inicial del negocio', () => {
  beforeEach(() => {
    cy.mockGuards({ configuracionCompleta: false });
    cy.intercept('GET', '**/api/configuracion', {
      configuracionCompleta: false,
      emailSmtp: '',
      smtpPasswordConfigured: false,
      nombreNegocio: '',
      telefonoNegocio: '',
      terminosCondiciones: '',
      logoBase64: '',
      mediosPago: {
        yapeActivo: false,
        yapeTelefono: '',
        plinActivo: false,
        plinTelefono: '',
        transferenciaActiva: false,
        transferencias: [],
      },
    }).as('config');
  });

  it('carga el formulario en blanco', () => {
    cy.visit('/setup');
    cy.wait('@config');
    cy.contains('Información del negocio y correo SMTP').should('be.visible');
  });

  it('exige gmail.com para el correo SMTP', () => {
    cy.visit('/setup');
    cy.wait('@config');
    cy.get('input[name="email"]').type('negocio@outlook.com');
    cy.contains('button', 'Enviar código de verificación al correo SMTP').click();
    cy.contains('Debe ser una cuenta @gmail.com.').should('be.visible');
  });

  it('envía el código de verificación SMTP', () => {
    cy.intercept('POST', '**/api/configuracion/enviar-verificacion', {
      message: 'Código enviado correctamente a negocio@gmail.com',
    }).as('enviarCodigo');
    cy.visit('/setup');
    cy.wait('@config');
    cy.get('input[name="email"]').type('negocio@gmail.com');
    cy.get('input[name="pass"]').type('abcdefghijklmnop');
    cy.contains('button', 'Enviar código de verificación al correo SMTP').click();
    cy.wait('@enviarCodigo');
    cy.contains('Código enviado correctamente').should('be.visible');
  });

  it('guarda la configuración completa', () => {
    cy.intercept('POST', '**/api/configuracion/enviar-verificacion', { message: 'ok' }).as('enviarCodigo');
    cy.intercept('POST', '**/api/configuracion/validar-y-guardar', {}).as('guardar');
    cy.visit('/setup');
    cy.wait('@config');
    cy.get('input[name="email"]').type('negocio@gmail.com');
    cy.get('input[name="pass"]').type('abcdefghijklmnop');
    cy.contains('button', 'Enviar código de verificación al correo SMTP').click();
    cy.wait('@enviarCodigo');
    cy.contains('button', 'Entendido').click();
    cy.get('input[name="codigo"]').type('123456');
    cy.get('input[name="n"]').type('Mi Restaurante');
    cy.get('input[name="tel"]').type('912345678');
    cy.get('textarea[name="tc"]').type('Términos y condiciones de prueba.');
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('fake-image'),
        fileName: 'logo.png',
        mimeType: 'image/png',
      },
      { force: true },
    );
    cy.contains('button', 'Guardar configuración').click();
    cy.wait('@guardar');
    cy.contains('Configuración guardada correctamente.').should('be.visible');
  });
});
