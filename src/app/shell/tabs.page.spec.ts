import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, AuthUser } from '../core/services/auth.service';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let fixture: ComponentFixture<TabsPage>;

  it('should render Explore/Bookings/Profile and hide Admin by default', async () => {
    const userSig = signal<AuthUser | null>(null);

    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: userSig.asReadonly(),
            loadProfile: () => of(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Explore');
    expect(text).toContain('Bookings');
    expect(text).toContain('Profile');
    expect(text).not.toContain('Admin');
  });

  it('should show Admin tab only for admin user', async () => {
    const userSig = signal<AuthUser | null>({
      id: 'u1',
      email: 'a@b.com',
      name: null,
      phone: null,
      isAdmin: true,
    });

    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: userSig.asReadonly(),
            loadProfile: () => of(userSig()),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Admin');
  });
});

