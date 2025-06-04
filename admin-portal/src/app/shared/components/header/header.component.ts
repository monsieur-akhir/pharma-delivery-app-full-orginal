import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { AuthService, User } from '../../../core/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ]
})
export class HeaderComponent {
  @Input() title: string = 'Pharmacy Admin';
  @Input() drawer!: MatSidenav;
  @Output() logoutClick = new EventEmitter<void>();

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  currentUser$ = this.authService.currentUser$;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService
  ) { }

  // Méthode pour obtenir le nom d'affichage
  getUserDisplayName(user: any): string {
    if (!user) return '';
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.name || user.username || '';
  }

  toggleDrawer(): void {
    this.drawer.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.logoutClick.emit();
  }
}