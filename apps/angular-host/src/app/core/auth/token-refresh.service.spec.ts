import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { TokenRefreshService } from './token-refresh.service';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let httpMock: HttpTestingController;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const authMock = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      login: jest.fn(),
      logout: jest.fn()
    };
    const routerMock = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TokenRefreshService,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(TokenRefreshService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    service.stopPolling();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start polling and refresh token every 5 minutes', fakeAsync(() => {
    service.startPolling();

    // Advance time by 5 minutes
    tick(5 * 60 * 1000);

    const req = httpMock.expectOne('http://localhost:3001/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    
    const mockResponse = { token: 'new-token', user: { id: '1', name: 'User' } };
    req.flush(mockResponse);

    expect(authService.login).toHaveBeenCalledWith(mockResponse.token, mockResponse.user);
    
    service.stopPolling();
  }));

  it('should logout on refresh failure', fakeAsync(() => {
    service.startPolling();

    tick(5 * 60 * 1000);

    const req = httpMock.expectOne('http://localhost:3001/api/auth/refresh');
    req.error(new ErrorEvent('Network error'), { status: 401 });

    expect(authService.logout).toHaveBeenCalled();
    
    service.stopPolling();
  }));

  it('should stop polling when stopPolling is called', fakeAsync(() => {
    service.startPolling();
    service.stopPolling();

    tick(10 * 60 * 1000); // 10 minutes

    httpMock.expectNone('http://localhost:3001/api/auth/refresh');
  }));
});
