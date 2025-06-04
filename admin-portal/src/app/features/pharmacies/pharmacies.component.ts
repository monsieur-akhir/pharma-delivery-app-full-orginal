import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PharmacyListComponent } from './pharmacy-list/pharmacy-list.component';
import { PharmacyCreateDialogComponent } from './pharmacy-create-dialog/pharmacy-create-dialog.component';

@Component({
  selector: 'app-pharmacies',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    PharmacyListComponent
  ],
  template: `
    <div class="pharmacies-container">
      <div class="header">
        <h1>Gestion des Pharmacies</h1>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="createNewPharmacy()">
            <mat-icon>add</mat-icon> Nouvelle Pharmacie
          </button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Toutes les pharmacies">
          <app-pharmacy-list></app-pharmacy-list>
        </mat-tab>
        <mat-tab label="En attente d'approbation">
          <app-pharmacy-list [statusFilter]="'PENDING'"></app-pharmacy-list>
        </mat-tab>
        <mat-tab label="Approuvées">
          <app-pharmacy-list [statusFilter]="'APPROVED'"></app-pharmacy-list>
        </mat-tab>
        <mat-tab label="Suspendues">
          <app-pharmacy-list [statusFilter]="'SUSPENDED'"></app-pharmacy-list>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .pharmacies-container {
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    mat-tab-group {
      margin-top: 20px;
    }
  `]
})
export class PharmaciesComponent implements OnInit {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  createNewPharmacy(): void {
    const dialogRef = this.dialog.open(PharmacyCreateDialogComponent, {
      width: '800px'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Pharmacie créée avec succès', 'Fermer', {
          duration: 3000
        });
        
        // Refresh the current tab
        window.location.reload();
      }
    });
  }
}