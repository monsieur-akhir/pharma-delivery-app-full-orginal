import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Pharmacy Delivery Admin Portal</mat-card-title>
          <mat-card-subtitle>Welcome to the admin dashboard</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>The pharmacy delivery application has been successfully migrated to Replit.</p>
          <div class="actions">
            <button mat-raised-button color="primary" routerLink="/pharmacies">
              <mat-icon>local_pharmacy</mat-icon>
              Manage Pharmacies
            </button>
            <button mat-raised-button color="accent" routerLink="/users">
              <mat-icon>people</mat-icon>
              Manage Users
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .actions {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }
    .actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}