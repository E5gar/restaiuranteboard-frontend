import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';
import { PanelRepartidorComponent } from './panel-repartidor';

describe('PanelRepartidorComponent', () => {
  let component: PanelRepartidorComponent;
  let fixture: ComponentFixture<PanelRepartidorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelRepartidorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelRepartidorComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
