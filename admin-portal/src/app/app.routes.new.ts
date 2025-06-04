import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./core/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./core/components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'auth',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'medicines',
    loadComponent: () => import('./features/medicines/medicines.component').then(m => m.MedicinesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'deliveries',
    loadComponent: () => import('./features/deliveries/deliveries.component').then(m => m.DeliveriesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [AuthGuard],
    data: { requiredRole: ['admin', 'ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'pharmacies',
    loadComponent: () => import('./features/pharmacies/pharmacies.component').then(m => m.PharmaciesComponent),
    canActivate: [AuthGuard],
    data: { requiredRole: ['admin', 'ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'pharmacy/:id/profile',
    loadComponent: () => import('./features/pharmacies/pharmacy-profile/pharmacy-profile.component').then(m => m.PharmacyProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'pharmacy-messages',
    loadComponent: () => import('./features/pharmacy-management/pharmacy-messages/pharmacy-messages.component').then(m => m.PharmacyMessagesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'video-chat',
    loadComponent: () => import('./features/video-chat/video-chat.component').then(m => m.VideoChatComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard],
    data: { requiredRole: 'admin' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/settings/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'supplier-orders',
    loadComponent: () => import('./features/supplier-orders/supplier-orders.component').then(m => m.SupplierOrdersComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'prescriptions/pending',
    loadComponent: () => import('./features/prescriptions/pending-prescriptions/pending-prescriptions.component').then(m => m.PendingPrescriptionsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'role-permissions',
    loadChildren: () => import('./features/role-permissions/role-permissions.module').then(m => m.RolePermissionsModule),
    canActivate: [AuthGuard],
    data: { requiredRole: ['ADMIN', 'SUPER_ADMIN'] }
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
