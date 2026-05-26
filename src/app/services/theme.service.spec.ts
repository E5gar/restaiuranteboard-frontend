import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('applyDark', () => {
    it('adds dark class when enabled', () => {
      service.applyDark(true);

      expect(service.isDark()).toBe(true);
    });

    it('removes dark class when disabled', () => {
      service.applyDark(true);
      service.applyDark(false);

      expect(service.isDark()).toBe(false);
    });
  });

  describe('toggle', () => {
    it('persists guest theme in sessionStorage when not logged in', () => {
      service.applyDark(false);

      service.toggle();

      expect(sessionStorage.getItem('rb_guest_dark')).toBe('1');
      expect(service.isDark()).toBe(true);
    });
  });

  describe('onLogout', () => {
    it('keeps current theme as guest preference', () => {
      service.applyDark(true);

      service.onLogout();

      expect(sessionStorage.getItem('rb_guest_dark')).toBe('1');
      expect(service.isDark()).toBe(true);
    });
  });
});
