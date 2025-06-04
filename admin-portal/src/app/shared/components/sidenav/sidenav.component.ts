import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { User } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roleAccess?: string[];
  badge?: number;
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatBadgeModule
  ]
})
export class SidenavComponent implements OnInit {
  @Input() user: User | null = null;
  
  currentRoute: string = '';
  
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Pharmacies',
      icon: 'local_pharmacy',
      route: '/pharmacies'
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/users',
      roleAccess: ['ADMIN', 'SUPER_ADMIN'] // Only for admin users
    },
    {
      label: 'Orders',
      icon: 'shopping_cart',
      route: '/orders',
      badge: 12
    },
    {
      label: 'Prescriptions',
      icon: 'receipt',
      route: '/prescriptions',
      badge: 5
    },
    {
      label: 'Supplier Orders',
      icon: 'inventory',
      route: '/supplier-orders'
    },
    {
      label: 'Role Permissions',
      icon: 'admin_panel_settings',
      route: '/role-permissions',
      roleAccess: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'AI Settings',
      icon: 'settings',
      route: '/ai-settings',
      roleAccess: ['SUPER_ADMIN'] // Only for super admin
    },
    {
      label: 'System Logs',
      icon: 'list_alt',
      route: '/system-logs',
      roleAccess: ['ADMIN', 'SUPER_ADMIN']
    }
  ];
  
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }
  
  ngOnInit(): void {
    this.currentRoute = this.router.url;
  }
  
  hasAccess(item: MenuItem): boolean {
    if (!item.roleAccess) {
      return true;
    }
    
    return !!this.user && item.roleAccess.includes(this.user.role);
  }
}