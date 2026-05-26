import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { GestionAdministradorComponent } from './gestion-administrador';

describe('GestionAdministradorComponent', () => {
  let component: GestionAdministradorComponent;
  let fixture: ComponentFixture<GestionAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAdministradorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ConfigService,
          useValue: { obtenerConfiguracion: () => of({ configuracionCompleta: true }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionAdministradorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
