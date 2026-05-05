import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: jest.Mocked<Router>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@test.com',
    document: '00000000000191'
  };

  beforeEach(() => {
    const routerMock = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock }
      ]
    });

    // Clear localStorage before each test
    localStorage.clear();
    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no user if storage is empty', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should save credentials to localStorage on login', () => {
    service.login('fake-token', mockUser);
    
    expect(localStorage.getItem('jwt_token')).toBe('fake-token');
    expect(JSON.parse(localStorage.getItem('user_info')!)).toEqual(mockUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()).toEqual(mockUser);
  });

  it('should clear storage and navigate to login on logout', () => {
    service.login('fake-token', mockUser);
    service.logout();

    expect(localStorage.getItem('jwt_token')).toBeNull();
    expect(localStorage.getItem('user_info')).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should sync with storage events (multi-tab support)', () => {
    // Manually trigger a storage event
    const storageEvent = new StorageEvent('storage', {
      key: 'jwt_token',
      newValue: 'new-token'
    });
    
    // Mock user_info in storage so initSessionFromStorage works
    localStorage.setItem('user_info', JSON.stringify(mockUser));
    localStorage.setItem('jwt_token', 'new-token');

    window.dispatchEvent(storageEvent);

    expect(service.token()).toBe('new-token');
    expect(service.isAuthenticated()).toBe(true);
  });
});
