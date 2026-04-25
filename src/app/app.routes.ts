import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-tabs.page').then((m) => m.AdminTabsPage),
    canActivate: [adminGuard],
    children: [
      {
        path: 'fighters',
        loadComponent: () =>
          import('./pages/admin/admin-fighters.page').then((m) => m.AdminFightersPage),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./pages/admin/admin-services.page').then((m) => m.AdminServicesPage),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./pages/admin/admin-schedule.page').then((m) => m.AdminSchedulePage),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/admin/admin-bookings.page').then((m) => m.AdminBookingsPage),
      },
      {
        path: 'bookings/:bookingId',
        loadComponent: () =>
          import('./pages/admin/admin-booking-detail.page').then((m) => m.AdminBookingDetailPage),
      },
      { path: '', redirectTo: 'fighters', pathMatch: 'full' },
    ],
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'fighters/:fighterId',
    loadComponent: () =>
      import('./pages/fighter-profile/fighter-profile.page').then((m) => m.FighterProfilePage),
  },
  {
    path: 'book',
    loadComponent: () =>
      import('./pages/book-placeholder/book-placeholder.page').then((m) => m.BookPlaceholderPage),
  },
  {
    path: 'pay/return',
    loadComponent: () =>
      import('./pages/payment-return/payment-return.page').then((m) => m.PaymentReturnPage),
  },
  {
    path: 'booking/success',
    loadComponent: () =>
      import('./pages/booking-success/booking-success.page').then((m) => m.BookingSuccessPage),
  },
  {
    path: 'my-bookings',
    loadComponent: () => import('./pages/my-bookings/my-bookings.page').then((m) => m.MyBookingsPage),
    canActivate: [authGuard],
  },
  {
    path: 'bookings/:bookingId',
    loadComponent: () =>
      import('./pages/booking-detail/booking-detail.page').then((m) => m.BookingDetailPage),
    canActivate: [authGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
