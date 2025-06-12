import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Pharmacy Delivery Admin Portal</h1>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/pharmacies" routerLinkActive="active">Pharmacies</a>
          <a routerLink="/users" routerLinkActive="active">Users</a>
        </nav>
      </header>
      <main class="app-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .app-header {
      background: #1976d2;
      color: white;
      padding: 1rem 2rem;
    }
    .app-header h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
    }
    .app-header nav {
      display: flex;
      gap: 1rem;
    }
    .app-header nav a {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .app-header nav a:hover,
    .app-header nav a.active {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .app-content {
      flex: 1;
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'Pharmacy Delivery Admin Portal';
}