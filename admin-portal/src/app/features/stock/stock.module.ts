import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Import Material Modules
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

// Import Components
import { PharmacyStockListComponent } from './pharmacy-stock-list/pharmacy-stock-list.component';
import { StockAdjustDialogComponent } from './stock-adjust-dialog/stock-adjust-dialog.component';
import { StockTransferDialogComponent } from './stock-transfer-dialog/stock-transfer-dialog.component';
import { StockMovementsDialogComponent } from './stock-movements-dialog/stock-movements-dialog.component';
import { AuthGuard } from '../../core/guards/auth.guard';
// import { RoleGuard } from '../../core/guards/role.guard'; // FIXME: RoleGuard file is missing

const routes: Routes = [
  { 
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    component: PharmacyStockListComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Gestion des stocks',
      roles: ['ADMIN', 'SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACY_STAFF']
    }
  },
  {
    path: 'pharmacy/:id',
    component: PharmacyStockListComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Stock de la pharmacie',
      roles: ['ADMIN', 'SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACY_STAFF']
    }
  },
  {
    path: 'alerts',
    component: PharmacyStockListComponent,
    canActivate: [AuthGuard],
    data: { 
      title: 'Alertes de stock',
      roles: ['ADMIN', 'SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACY_STAFF'],
      showAlertsOnly: true
    }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    PharmacyStockListComponent,
    StockAdjustDialogComponent,
    StockTransferDialogComponent,
    StockMovementsDialogComponent
  ],
  exports: [
    RouterModule
  ]
})
export class StockModule { }
