import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import {
  flushAuthDarkModeRequest,
  provideIntegrationRouter,
  testJwt,
} from '../../testing/integration-helpers';
import { LoginComponent } from './login';

describe('LoginComponent integration', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideIntegrationRouter()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
    const configReq = httpMock.expectOne(`${environment.apiUrl}/configuracion`);
    configReq.flush({ configuracionCompleta: true });
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('onLogin sends POST and stores session on success', async () => {
    component.email = 'cliente@gmail.com';
    component.password = 'Secret1@';
    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'cliente@gmail.com',
      password: 'Secret1@',
    });
    req.flush({
      token: testJwt(3600),
      email: 'cliente@gmail.com',
      role: 'CLIENTE',
      userId: 'u1',
      firstLogin: false,
      darkMode: false,
    });
    flushAuthDarkModeRequest(httpMock);
    await fixture.whenStable();
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getSession()?.role).toBe('CLIENTE');
  });

  it('onLogin shows error modal when backend rejects credentials', async () => {
    component.email = 'cliente@gmail.com';
    component.password = 'wrong';
    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'Contraseña incorrecta.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(component.modal.visible).toBe(true);
    expect(component.modal.esError).toBe(true);
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('onLogin switches to MFA step when backend requires second factor', async () => {
    component.email = 'cliente@gmail.com';
    component.password = 'Secret1@';
    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({
      mfaRequired: true,
      mfaToken: 'pending-mfa-token',
      email: 'cliente@gmail.com',
    });
    await fixture.whenStable();

    expect(component.paso).toBe('mfa');
    expect(component.mfaToken).toBe('pending-mfa-token');
    expect(auth.isLoggedIn()).toBe(false);
  });
});
