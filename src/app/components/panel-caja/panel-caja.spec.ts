import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';
import { PanelCajaComponent } from './panel-caja';

describe('PanelCajaComponent', () => {
  let component: PanelCajaComponent;
  let fixture: ComponentFixture<PanelCajaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelCajaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelCajaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
