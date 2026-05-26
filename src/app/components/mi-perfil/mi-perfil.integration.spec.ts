import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import { testJwt } from '../../testing/integration-helpers';
import { MiPerfilComponent } from './mi-perfil';

describe('MiPerfilComponent integration', () => {
  let fixture: ComponentFixture<MiPerfilComponent>;
  let component: MiPerfilComponent;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MiPerfilComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), userId: 'u1', role: 'CLIENTE', email: 'c@gmail.com' });

    fixture = TestBed.createComponent(MiPerfilComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const profileReq = httpMock.expectOne(`${environment.apiUrl}/perfil/me`);
    profileReq.flush({
      userId: 'u1',
      fullName: 'Juan Pérez',
      phone: '912345678',
      address: 'Av. 1',
      dni: '12345678',
      email: 'c@gmail.com',
      role: 'CLIENTE',
      canEditAddress: true,
    });
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    httpMock.verify();
    sessionStorage.clear();
  });

  it('cargarPerfil fills form from API', async () => {
    await fixture.whenStable();
    expect(component.form.fullName).toBe('Juan Pérez');
    expect(component.form.phone).toBe('912345678');
  });

  it('guardarCambios puts profile update to backend', async () => {
    await fixture.whenStable();
    component.form.fullName = 'Juan Pérez Gómez';
    component.form.phone = '987654321';
    component.form.address = 'Av. 2';
    component.guardarCambios();

    const req = httpMock.expectOne(`${environment.apiUrl}/perfil/me`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.fullName).toBe('Juan Pérez Gómez');
    req.flush({
      userId: 'u1',
      fullName: 'Juan Pérez Gómez',
      phone: '987654321',
      address: 'Av. 2',
      dni: '12345678',
      email: 'c@gmail.com',
      role: 'CLIENTE',
      canEditAddress: true,
    });
    await fixture.whenStable();
    expect(component.modal()?.tipo).toBe('ok');
  });
});
