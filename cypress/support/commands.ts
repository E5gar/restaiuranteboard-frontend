// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(session?: Partial<RbSession>): Chainable<void>;
      mockGuards(opts?: { configuracionCompleta?: boolean; ipBlocked?: boolean }): Chainable<void>;
    }
  }
}

interface RbSession {
  userId: string;
  role: 'CLIENTE' | 'ADMIN' | 'CAJERO' | 'COCINERO' | 'REPARTIDOR';
  email: string;
  fullName: string;
  firstLogin: boolean;
  darkMode: boolean;
}

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fakeJwt(expOffsetSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const payload = base64UrlEncode({ exp });
  return `${header}.${payload}.sig`;
}

Cypress.Commands.add('loginAs', (session: Partial<RbSession> = {}) => {
  const base: RbSession = {
    userId: 'user-e2e-1',
    role: 'CLIENTE',
    email: 'e2e@gmail.com',
    fullName: 'Usuario E2E',
    firstLogin: false,
    darkMode: false,
    ...session,
  };
  const token = fakeJwt(3600);
  Cypress.env('fakeSession', { token, ...base });
});

Cypress.Commands.add(
  'mockGuards',
  (opts: { configuracionCompleta?: boolean; ipBlocked?: boolean } = {}) => {
    const configuracionCompleta = opts.configuracionCompleta ?? true;
    const ipBlocked = opts.ipBlocked ?? false;
    cy.intercept('GET', '**/api/configuracion/estado', { configuracionCompleta }).as('estadoConfig');
    cy.intercept('GET', '**/api/auth/ip-status', {
      blocked: ipBlocked,
      ipAddress: '127.0.0.1',
      remainingSeconds: ipBlocked ? 1800 : 0,
    }).as('ipStatus');
    cy.intercept('GET', '**/api/carrito*', { items: [], removedItems: [] }).as('carritoDefault');
    cy.intercept('GET', '**/api/soporte/admin/pendientes-count', { pendientes: 0 }).as('soportePendientes');
  },
);