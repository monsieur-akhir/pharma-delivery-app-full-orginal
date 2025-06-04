import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';

// Angular Material Modules
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

// Componentes de pharmacies
import { PharmacyListComponent } from './pharmacy-list/pharmacy-list.component';
import { PharmaciesComponent } from './pharmacies.component';
import { PharmacyRejectDialogComponent } from './pharmacy-reject-dialog/pharmacy-reject-dialog.component';
import { PharmacyDetailsComponent } from './pharmacy-details/pharmacy-details.component';
import { PharmacyUsersComponent } from './pharmacy-users/pharmacy-users.component';
import { PharmacyUserDialogComponent } from './pharmacy-users/pharmacy-user-dialog/pharmacy-user-dialog.component';

@NgModule({
  declarations: [
    PharmacyListComponent,
    PharmaciesComponent,
    PharmacyRejectDialogComponent,
    PharmacyDetailsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
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
    // Import standalone components
    PharmacyUsersComponent,
    PharmacyUserDialogComponent
  ],
  exports: [
    PharmacyListComponent,
    PharmaciesComponent
  ]
})
export class PharmaciesModule { }