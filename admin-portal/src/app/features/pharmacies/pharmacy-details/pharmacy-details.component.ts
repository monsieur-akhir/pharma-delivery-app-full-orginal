import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PharmaciesService } from '../pharmacies.service';
import { Pharmacy, PharmacyStaffMember, PharmacyStats, PharmacyStatus } from '../../../core/models/pharmacy.model';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PharmacyUsersComponent } from '../pharmacy-users/pharmacy-users.component';

@Component({
  selector: 'app-pharmacy-details',
  templateUrl: './pharmacy-details.component.html',
  styleUrls: ['./pharmacy-details.component.scss']
})
export class PharmacyDetailsComponent implements OnInit {
  pharmacyId!: number;
  pharmacy: Pharmacy | null = null;
  pharmacyStats: PharmacyStats | null = null;
  staffMembers: PharmacyStaffMember[] = [];
  
  isLoading = true;
  error: string | null = null;
  staffLoading = false;
  staffError: string | null = null;
  statsLoading = false;
  statsError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pharmaciesService: PharmaciesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('Pharmacy ID is missing');
        }
        this.pharmacyId = +id;
        return this.loadPharmacyData(this.pharmacyId);
      })
    ).subscribe(
      _ => {
        this.isLoading = false;
      },
      error => {
        console.error('Error loading pharmacy data', error);
        this.error = 'Impossible de charger les données de la pharmacie. Veuillez réessayer.';
        this.isLoading = false;
      }
    );
  }

  loadPharmacyData(pharmacyId: number) {
    this.isLoading = true;
    this.error = null;
    this.statsLoading = true;
    this.staffLoading = true;

    return forkJoin({
      pharmacy: this.pharmaciesService.getPharmacyById(pharmacyId).pipe(
        // Adapter le modèle de l'API au modèle local
        map(apiPharmacy => {
          const pharmacy: Pharmacy = {
            id: apiPharmacy.id,
            name: apiPharmacy.name,
            address: apiPharmacy.address,
            city: apiPharmacy.city,
            country: apiPharmacy.country,
            phoneNumber: apiPharmacy.phone,
            email: apiPharmacy.email,
            licenseNumber: apiPharmacy.licenseNumber,
            status: apiPharmacy.status as PharmacyStatus,
            createdAt: apiPharmacy.createdAt,
            updatedAt: apiPharmacy.updatedAt,
            ownerId: apiPharmacy.ownerId,
            ownerName: apiPharmacy.ownerName,
            staffCount: apiPharmacy.staffCount,
            medicineCount: apiPharmacy.medicineCount
          };
          return pharmacy;
        }),
        catchError(error => {
          console.error('Error loading pharmacy', error);
          this.error = 'Impossible de charger les données de la pharmacie. Veuillez réessayer.';
          return of(null);
        })
      ),
      stats: of({ // Mock pharmacy stats as it's not yet implemented in the API
        totalProducts: 0,
        lowStockProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalSales: 0,
        totalCustomers: 0
      }).pipe(
        catchError(error => {
          console.error('Error loading pharmacy stats', error);
          this.statsError = 'Impossible de charger les statistiques de la pharmacie.';
          return of(null);
        })
      ),
      staff: of([]).pipe( // Mock staff as it's not yet implemented in the API
        catchError(error => {
          console.error('Error loading pharmacy staff', error);
          this.staffError = 'Impossible de charger la liste du personnel.';
          return of([]);
        })
      )
    }).pipe(
      switchMap(results => {
        this.pharmacy = results.pharmacy;
        this.pharmacyStats = results.stats;
        this.staffMembers = results.staff;
        
        this.statsLoading = false;
        this.staffLoading = false;
        
        return of(results);
      })
    );
  }

  editPharmacy(): void {
    if (this.pharmacyId) {
      this.router.navigate(['/pharmacies', this.pharmacyId, 'edit']);
    }
  }

  updateStatus(status: PharmacyStatus): void {
    if (!this.pharmacyId) return;
    
    // Utiliser la méthode correspondante selon le statut
    let statusUpdate$;
    
    switch (status) {
      case PharmacyStatus.APPROVED:
        statusUpdate$ = this.pharmaciesService.approvePharmacy(this.pharmacyId);
        break;
      case PharmacyStatus.SUSPENDED:
        statusUpdate$ = this.pharmaciesService.suspendPharmacy(this.pharmacyId);
        break;
      case PharmacyStatus.REJECTED:
        statusUpdate$ = this.pharmaciesService.rejectPharmacy(this.pharmacyId);
        break;
      default:
        // Pour PENDING, utiliser update générique
        statusUpdate$ = this.pharmaciesService.updatePharmacy(this.pharmacyId, { status });
    }
    
    statusUpdate$.pipe(
      // Convertir la réponse API vers notre modèle local
      map((apiPharmacy: any) => {
        const pharmacy: Pharmacy = {
          id: apiPharmacy.id,
          name: apiPharmacy.name,
          address: apiPharmacy.address,
          city: apiPharmacy.city,
          country: apiPharmacy.country,
          phoneNumber: apiPharmacy.phone,
          email: apiPharmacy.email,
          licenseNumber: apiPharmacy.licenseNumber,
          status: apiPharmacy.status as PharmacyStatus,
          createdAt: apiPharmacy.createdAt,
          updatedAt: apiPharmacy.updatedAt,
          ownerId: apiPharmacy.ownerId,
          ownerName: apiPharmacy.ownerName,
          staffCount: apiPharmacy.staffCount,
          medicineCount: apiPharmacy.medicineCount
        };
        return pharmacy;
      })
    ).subscribe(
      (updatedPharmacy: Pharmacy) => {
        this.pharmacy = updatedPharmacy;
        this.snackBar.open(`Statut mis à jour: ${status}`, 'Fermer', {
          duration: 3000
        });
      },
      (error: any) => {
        console.error('Error updating pharmacy status', error);
        this.snackBar.open('Impossible de mettre à jour le statut. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  addStaffMember(): void {
    // Implement staff member dialog
    this.snackBar.open('Fonctionnalité à implémenter: Ajouter un membre du personnel', 'Fermer', {
      duration: 3000
    });
  }

  removeStaffMember(staffId: number): void {
    if (!this.pharmacyId) return;
    
    // Cette fonctionnalité n'est pas encore implémentée dans le service
    // Simulons la suppression
    this.staffMembers = this.staffMembers.filter(member => member.id !== staffId);
    this.snackBar.open('Membre du personnel supprimé avec succès', 'Fermer', {
      duration: 3000
    });
    
    // Commentaire du code original qui sera implémenté plus tard:
    /*
    this.pharmaciesService.removeStaffMember(this.pharmacyId, staffId).subscribe(
      () => {
        this.staffMembers = this.staffMembers.filter(member => member.id !== staffId);
        this.snackBar.open('Membre du personnel supprimé avec succès', 'Fermer', {
          duration: 3000
        });
      },
      (error: any) => {
        console.error('Error removing staff member', error);
        this.snackBar.open('Impossible de supprimer le membre du personnel. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
    */
  }

  getStatusClass(status: PharmacyStatus): string {
    switch (status) {
      case PharmacyStatus.APPROVED:
        return 'status-approved';
      case PharmacyStatus.PENDING:
        return 'status-pending';
      case PharmacyStatus.SUSPENDED:
        return 'status-suspended';
      case PharmacyStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/pharmacies']);
  }
}