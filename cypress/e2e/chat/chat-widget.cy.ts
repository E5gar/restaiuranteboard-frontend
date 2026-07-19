describe('Chat Widget (cliente)', () => {
  beforeEach(() => {
    cy.mockGuards();
    cy.loginAs({ role: 'CLIENTE', userId: 'cliente-1' });
    cy.intercept('GET', '**/api/catalogo/productos/menu/base', { productos: [] }).as('menuBase');
    cy.intercept('GET', '**/api/catalogo/productos/menu/recomendaciones*', {
      recommendedProductIds: [],
      showRecommendations: false,
      highlightedProducts: [],
    }).as('recs');
    cy.intercept('GET', '**/api/chat/cliente/sesion', {
      sessionId: 'sess-1',
      closed: false,
      userMessageCount: 0,
      maxUserMessages: 3,
      messages: [],
    }).as('sesionChat');
  });
  it('abre y cierra el panel de chat', () => {
    cy.visit('/menu');
    cy.wait(['@menuBase', '@sesionChat']);
    cy.get('button[aria-label="Abrir chat"]').click();
    cy.contains('Asistente del menu').should('be.visible');
    cy.get('button[aria-label="Cerrar"]').click();
    cy.contains('Asistente del menu').should('not.exist');
  });
  it('envía un mensaje y recibe respuesta', () => {
    cy.intercept('POST', '**/api/chat/cliente/mensaje', {
      sessionId: 'sess-1',
      reply: 'Claro, aquí tienes nuestras recomendaciones.',
      closed: false,
      uiAction: '',
      messages: [
        { sender: 'USER', content: '¿Qué me recomiendas?' },
        { sender: 'ASSISTANT', content: 'Claro, aquí tienes nuestras recomendaciones.' },
      ],
    }).as('mensaje');
    cy.visit('/menu');
    cy.wait(['@menuBase', '@sesionChat']);
    cy.get('button[aria-label="Abrir chat"]').click();
    cy.get('input[placeholder="Escribe aqui..."]').type('¿Qué me recomiendas?{enter}');
    cy.wait('@mensaje');
    cy.contains('Claro, aquí tienes nuestras recomendaciones.').should('be.visible');
  });
  it('muestra el botón de atención al cliente cuando corresponde', () => {
    cy.intercept('POST', '**/api/chat/cliente/mensaje', {
      sessionId: 'sess-1',
      reply: 'Lamento el inconveniente, por favor reporta el problema.',
      closed: false,
      uiAction: 'ATENCION_CLIENTE',
      messages: [],
    }).as('mensaje');
    cy.visit('/menu');
    cy.wait(['@menuBase', '@sesionChat']);
    cy.get('button[aria-label="Abrir chat"]').click();
    cy.get('input[placeholder="Escribe aqui..."]').type('Tengo un problema con mi pedido{enter}');
    cy.wait('@mensaje');
    cy.contains('button', 'Abrir Formulario de Atencion al Cliente').should('be.visible');
  });
  it('inicia un nuevo chat', () => {
    cy.intercept('POST', '**/api/chat/cliente/nueva-sesion', {
      sessionId: 'sess-2',
      closed: false,
      userMessageCount: 0,
      maxUserMessages: 3,
      messages: [],
    }).as('nuevaSesion');
    cy.visit('/menu');
    cy.wait(['@menuBase', '@sesionChat']);
    cy.get('button[aria-label="Abrir chat"]').click();
    cy.contains('button', 'Nuevo chat').click();
    cy.wait('@nuevaSesion');
  });
  it('abre la lista de chats guardados', () => {
    cy.intercept('GET', '**/api/chat/cliente/sesiones', [
      {
        sessionId: 'sess-1',
        createdAt: '2026-01-01T10:00:00',
        updatedAt: '2026-01-01T10:05:00',
        closed: true,
        userMessageCount: 3,
        maxUserMessages: 3,
        preview: '¿Qué me recomiendas?',
        canContinue: false,
      },
    ]).as('listaSesiones');
    cy.visit('/menu');
    cy.wait(['@menuBase', '@sesionChat']);
    cy.get('button[aria-label="Abrir chat"]').click();
    cy.contains('button', 'Mis chats').click();
    cy.wait('@listaSesiones');
    cy.contains('¿Qué me recomiendas?').should('be.visible');
  });
});