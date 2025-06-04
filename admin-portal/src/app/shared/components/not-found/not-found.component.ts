import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-icon class="not-found-icon">error_outline</mat-icon>
        <h1>404</h1>
        <h2>Page non trouvée</h2>
        <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <button mat-raised-button color="primary" (click)="goHome()">
          <mat-icon>home</mat-icon>
          Retour à l'accueil
        </button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    .not-found-content {
      text-align: center;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 400px;
    }
    .not-found-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      color: #f44336;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 3rem;
      color: #333;
      margin: 0;
    }
    h2 {
      color: #555;
      margin-top: 0.5rem;
    }
    p {
      color: #666;
      margin: 1rem 0 2rem;
    }
    button {
      margin-top: 1rem;
    }
  `]
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}