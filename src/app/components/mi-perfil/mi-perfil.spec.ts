import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '@env/environment';
import { AuthService } from '../../services/auth.service';
import { MiPerfilComponent } from './mi-perfil';

function base64UrlEncode(value: object): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function testJwt(expOffsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
  const payload = base64UrlEncode({ exp });
  return `${header}.${payload}.sig`;
}

describe('MiPerfilComponent', () => {
  let component: MiPerfilComponent;
  let fixture: ComponentFixture<MiPerfilComponent>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const perfilCliente = {
    userId: 'u1',
    fullName: 'Ana Pérez',
    phone: '912345678',
    address: 'Av. Lima 123',
    dni: '12345678',
    email: 'ana@gmail.com',
    role: 'CLIENTE',
    canEditAddress: true,
  };

  const perfilAdmin = {
    ...perfilCliente,
    role: 'ADMIN',
    canEditAddress: false,
  };

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MiPerfilComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.setSession({ token: testJwt(3600), role: 'CLIENTE', userId: 'u1' });

    fixture = TestBed.createComponent(MiPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function flushPerfil(data: typeof perfilCliente): void {
    const req = httpMock.expectOne(`${environment.apiUrl}/perfil/me`);
    req.flush(data);
    fixture.detectChanges();
  }

  it('sets esCliente true when profile role is CLIENTE', () => {
    flushPerfil(perfilCliente);

    expect(component.esCliente()).toBe(true);
  });

  it('sets esCliente false when profile role is not CLIENTE', () => {
    flushPerfil(perfilAdmin);

    expect(component.esCliente()).toBe(false);
  });

  it('shows delete zone only for CLIENTE in template', () => {
    flushPerfil(perfilCliente);

    const deleteZone = fixture.nativeElement.querySelector('.rb-btn-danger');
    expect(deleteZone).toBeTruthy();
  });

  it('hides delete zone for non-CLIENTE in template', () => {
    flushPerfil(perfilAdmin);

    const deleteZone = fixture.nativeElement.querySelector('.rb-btn-danger');
    expect(deleteZone).toBeFalsy();
  });

  it('opens delete modal for CLIENTE via abrirModalEliminar', () => {
    flushPerfil(perfilCliente);

    component.abrirModalEliminar();
    fixture.detectChanges();

    expect(component.modalEliminar()).toBe(true);
    const modal = fixture.nativeElement.querySelector('.rb-modal-backdrop');
    expect(modal).toBeTruthy();
  });
});
