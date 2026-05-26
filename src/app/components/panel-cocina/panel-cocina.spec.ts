import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { WebsocketService } from '../../services/websocket.service';
import { PanelCocinaComponent } from './panel-cocina';

describe('PanelCocinaComponent', () => {
  let component: PanelCocinaComponent;
  let fixture: ComponentFixture<PanelCocinaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelCocinaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: WebsocketService, useValue: { subscribeToTopic: () => EMPTY } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelCocinaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
