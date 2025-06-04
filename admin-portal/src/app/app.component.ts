import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';
import { AuthService, User } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatBadgeModule
  ],
  template: `
    <ng-container *ngIf="isLoggedIn; else loginTemplate">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #drawer class="sidenav" 
                    [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
                    [mode]="(isHandset$ | async) ? 'over' : 'side'"
                    [opened]="(isHandset$ | async) === false">
          <div class="sidenav-header">
            <div class="logo-container">
              <img src="assets/logo.png" alt="Logo" class="logo-image" />
            </div>
            <div class="user-info">
              <span class="user-role">Administrateur</span>
            </div>
          </div>
          
          <mat-nav-list>
            <h2 matSubheader>Menu Principal</h2>
            
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Tableau de bord</span>
            </a>
            
            <a mat-list-item routerLink="/pharmacies" routerLinkActive="active">
              <mat-icon matListItemIcon>local_pharmacy</mat-icon>
              <span matListItemTitle>Pharmacies</span>
            </a>
            
            <a mat-list-item routerLink="/users" routerLinkActive="active">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Utilisateurs</span>
            </a>
            
            <a mat-list-item routerLink="/commandes" routerLinkActive="active">
              <mat-icon matListItemIcon>shopping_cart</mat-icon>
              <span matListItemTitle>Commandes</span>
            </a>
            
            <a mat-list-item routerLink="/messages" routerLinkActive="active">
              <mat-icon matListItemIcon>message</mat-icon>
              <span matListItemTitle>Messages</span>
              <span matListItemMeta>
                <mat-icon matBadge="3" matBadgeColor="accent">notifications</mat-icon>
              </span>
            </a>
            
            <a mat-list-item routerLink="/commandes-fournisseurs" routerLinkActive="active">
              <mat-icon matListItemIcon>inventory</mat-icon>
              <span matListItemTitle>Commandes Fournisseurs</span>
            </a>
            
            <mat-divider></mat-divider>
            
            <h2 matSubheader>Paramètres</h2>
            
            <a mat-list-item routerLink="/settings/ia" routerLinkActive="active">
              <mat-icon matListItemIcon>psychology</mat-icon>
              <span matListItemTitle>Paramètres IA</span>
            </a>
            
            <a mat-list-item routerLink="/system" routerLinkActive="active">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span matListItemTitle>Logs Système</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>
        
        <mat-sidenav-content>
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </ng-container>
    
    <ng-template #loginTemplate>
      <div class="auth-page">
        <router-outlet></router-outlet>
      </div>
    </ng-template>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
      min-height: 100vh;
    }
    
    .sidenav {
      width: 260px;
      border-right: 1px solid var(--border-color);
      background-color: var(--background-secondary);
      color: var(--text-primary);
    }
    
    .sidenav-header {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }
    
    .logo-container {
      width: 80px;
      height: 80px;
      margin-bottom: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .logo-image {
      max-width: 100%;
      max-height: 100%;
    }
    
    .user-info {
      text-align: center;
      margin-bottom: 8px;
    }
    
    .user-role {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    /* Content area should take full width */
    .content-wrapper {
      width: 100%;
      height: 100%;
      background-color: var(--background-primary);
    }
    
    /* Active route styling */
    .mat-mdc-list-item.active {
      background-color: rgba(var(--accent-color-rgb), 0.1);
      color: var(--accent-color);
      border-left: 3px solid var(--accent-color);
    }
    
    .mat-mdc-list-item.active .mat-icon {
      color: var(--accent-color);
    }
    
    /* Authentication page */
    .auth-page {
      height: 100vh;
      width: 100vw;
      /* Auth pages always use light theme - see themes.scss */
    }
    
    /* Badges */
    .mat-badge-content {
      font-weight: 500;
      font-size: 10px;
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }
  `]
})
export class AppComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
  
  title = 'Pharmacy Admin Portal';
  isLoggedIn = false;
  currentUser: any = null;
  
  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    // Apply default theme
    this.themeService.setTheme('light');
    
    // Listen for auth state changes
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
    
    // Close sidenav on mobile when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.drawer && this.breakpointObserver.isMatched(Breakpoints.Handset)) {
        this.drawer.close();
      }
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}