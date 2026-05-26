import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { IpStatusService } from '../services/ip-status.service';
import { ipBlockGuard } from './ip-block.guard';

describe('ipBlockGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: IpStatusService,
          useValue: {
            obtenerEstado: () =>
              of({
                blocked: true,
                ipAddress: '127.0.0.1',
                remainingSeconds: 60,
              }),
          },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('redirects to retenido when IP is blocked', async () => {
    const guardResult = TestBed.runInInjectionContext(() => ipBlockGuard({} as never, {} as never));
    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/retenido');
    expect(router.parseUrl('/retenido').toString()).toBe((result as UrlTree).toString());
  });
});
