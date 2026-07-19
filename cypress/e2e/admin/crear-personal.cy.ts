describe('Crear personal', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'ADMIN', userId: 'admin-1' });
    cy.intercept('GET', '**/api/admin/personal/activos', [
      { userId: 'p1', fullName: 'Carlos Ruiz', role: 'REPARTIDOR', email: 'carlos@gmail.com' },
    ]).as('personal');
  });

  it('lista el personal activo', () => {
    cy.visit('/crear-personal');
    cy.wait('@personal');
    cy.contains('Carlos Ruiz').should('be.visible');
    cy.contains('REPARTIDOR').should('be.visible');
  });

  it('exige seleccionar un rol', () => {
    cy.visit('/crear-personal');
    cy.wait('@personal');
    cy.get('input[name="n"]').type('Luis');
    cy.get('input[name="a"]').type('García');
    cy.get('input[name="dni"]').type('12345678');
    cy.get('input[name="tel"]').type('912345678');
    cy.get('input[name="em"]').type('luis@gmail.com');
    cy.get('input[name="dir"]').type('Av. 1');
    cy.contains('button', 'Crear Empleado').click();
    cy.contains('Falta Rol').should('be.visible');
  });

  it('crea un nuevo empleado', () => {
    cy.intercept('POST', '**/api/auth/crear-empleado', {
      message: 'Empleado creado. Debe iniciar sesión con su correo para activar la cuenta.',
    }).as('crear');
    cy.visit('/crear-personal');
    cy.wait('@personal');
    cy.contains('button', 'CAJERO').click();
    cy.get('input[name="n"]').type('Luis');
    cy.get('input[name="a"]').type('García');
    cy.get('input[name="dni"]').type('12345678');
    cy.get('input[name="tel"]').type('912345678');
    cy.get('input[name="em"]').type('luis@gmail.com');
    cy.get('input[name="dir"]').type('Av. 1');
    cy.contains('button', 'Crear Empleado').click();
    cy.wait('@crear');
    cy.contains('Personal Creado').should('be.visible');
  });

  it('da de baja a un empleado', () => {
    cy.intercept('POST', '**/api/admin/personal/p1/eliminar', {
      message: 'Empleado dado de baja correctamente.',
    }).as('eliminar');
    cy.visit('/crear-personal');
    cy.wait('@personal');
    cy.contains('tr', 'Carlos Ruiz').find('button').click();
    cy.contains('button', 'Confirmar baja').click();
    cy.wait('@eliminar');
    cy.contains('Empleado dado de baja').should('be.visible');
  });
});