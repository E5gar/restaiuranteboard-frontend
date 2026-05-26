import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { configRequiredGuard } from './config-required.guard';

describe('configRequiredGuard', () => {
  let configMock: { obtenerEstado: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    configMock = {
      obtenerEstado: vi.fn(() => of({ configuracionCompleta: true })),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ConfigService, useValue: configMock }],
    });
  });

  it('allows activation when configuration is complete', async () => {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        configRequiredGuard({} as never, {} as never),
      ) as Observable<boolean | UrlTree>,
    );

    expect(result).toBe(true);
  });

  it('redirects to setup when configuration is incomplete', async () => {
    configMock.obtenerEstado.mockReturnValue(of({ configuracionCompleta: false }));

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        configRequiredGuard({} as never, {} as never),
      ) as Observable<boolean | UrlTree>,
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/setup');
  });

  it('redirects to setup when estado request fails', async () => {
    configMock.obtenerEstado.mockReturnValue(throwError(() => new Error('fail')));

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() =>
        configRequiredGuard({} as never, {} as never),
      ) as Observable<boolean | UrlTree>,
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/setup');
  });
});
