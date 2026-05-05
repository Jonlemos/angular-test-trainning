import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'charges',
        loadComponent: () => import('./features/charges/charges.component').then(m => m.ChargesComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'renegotiations',
        loadComponent: () => import('./features/renegotiations/renegotiations.component').then(m => m.RenegotiationsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./react-wrapper/react-wrapper.component').then(m => m.ReactWrapperComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
