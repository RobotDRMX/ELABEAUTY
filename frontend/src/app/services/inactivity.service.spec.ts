import { TestBed, fakeAsync, tick, discardPeriodicTasks, flush } from '@angular/core/testing';
import { InactivityService } from './inactivity.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';

import { signal } from '@angular/core';

describe('InactivityService', () => {
  let service: InactivityService;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNotif: jasmine.SpyObj<NotificationService>;
  let mockI18n: jasmine.SpyObj<I18nService>;

  beforeEach(() => {
    mockAuth = jasmine.createSpyObj('AuthService', ['logout'], {
      isAuthenticated: signal(true)
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockNotif = jasmine.createSpyObj('NotificationService', ['toast', 'confirm']);
    mockNotif.confirm.and.returnValue(Promise.resolve(false));

    TestBed.configureTestingModule({
      providers: [
        InactivityService,
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotif },
      ]
    });
    service = TestBed.inject(InactivityService);
  });

  afterEach(() => service.stop());

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('resetTimer should cancel pending timeouts', fakeAsync(() => {
    service.start(false);
    service.resetTimer();
    tick(25 * 60 * 1000 - 1);
    expect(mockNotif.confirm).not.toHaveBeenCalled();
    service.stop(); // clears pending timer so fakeAsync zone is clean
  }));

  it('should use 15min timeout for admin routes', fakeAsync(() => {
    service.start(true);
    tick(10 * 60 * 1000 + 1); // warning fires at 10min (15min total - 5min warning)
    expect(mockNotif.confirm).toHaveBeenCalled();
  }));
});
