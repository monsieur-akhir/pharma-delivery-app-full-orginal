import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/api/user.service';

@Component({
  selector: 'app-delivery-person-assign-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Assigner un livreur à la commande #{{ data.orderId }}</h2>
    
    <div mat-dialog-content>
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="30"></mat-spinner>
      </div>
      
      <div *ngIf="!isLoading">
        <p>Veuillez sélectionner un livreur pour cette commande</p>
        
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Livreur</mat-label>
          <mat-select [(ngModel)]="selectedDeliveryPersonId">
            <mat-option *ngFor="let person of deliveryPeople" [value]="person.id">
              {{ person.name }} - {{ person.status }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" 
              [disabled]="!selectedDeliveryPersonId || isLoading" 
              (click)="onConfirm()">
        Assigner
      </button>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    .full-width {
      width: 100%;
    }
  `]
})
export class DeliveryPersonAssignDialogComponent implements OnInit {
  deliveryPeople: any[] = [];
  selectedDeliveryPersonId: number | null = null;
  isLoading: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<DeliveryPersonAssignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orderId: string },
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDeliveryPeople();
  }

  loadDeliveryPeople(): void {
    this.isLoading = true;
    
    // Appel au service utilisateur pour récupérer uniquement les livreurs
    this.userService.getUsers(1, 100, 'DELIVERY_PERSON', 'active').subscribe({
      next: (response) => {
        this.deliveryPeople = response.users.map((user: any) => ({
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          status: user.isActive ? 'Disponible' : 'Indisponible'
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading delivery people:', error);
        this.isLoading = false;
      }
    });
  }

  onConfirm(): void {
    if (this.selectedDeliveryPersonId) {
      this.dialogRef.close(this.selectedDeliveryPersonId);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
