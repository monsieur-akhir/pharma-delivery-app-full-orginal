import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../users.service';
import { User, UserRole, UserStats, UserStatus } from '../../../core/models/user.model';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit {
  userId!: number;
  user: User | null = null;
  userStats: UserStats | null = null;
  userPharmacies: any[] = [];
  userOrders: any = { data: [], total: 0 };
  
  isLoading = true;
  error: string | null = null;
  statsLoading = false;
  statsError: string | null = null;
  pharmaciesLoading = false;
  pharmaciesError: string | null = null;
  ordersLoading = false;
  ordersError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('User ID is missing');
        }
        this.userId = +id;
        return this.loadUserData(this.userId);
      })
    ).subscribe(
      _ => {
        this.isLoading = false;
      },
      error => {
        console.error('Error loading user data', error);
        this.error = 'Impossible de charger les données de l\'utilisateur. Veuillez réessayer.';
        this.isLoading = false;
      }
    );
  }

  loadUserData(userId: number) {
    this.isLoading = true;
    this.error = null;
    this.statsLoading = true;
    this.pharmaciesLoading = true;
    this.ordersLoading = true;

    return this.usersService.getUser(userId).pipe(
      catchError(error => {
        console.error('Error loading user', error);
        this.error = 'Impossible de charger les données de l\'utilisateur. Veuillez réessayer.';
        return of(null);
      }),
      switchMap(user => {
        this.user = user;
        
        if (!user) {
          return of(null);
        }

        // Load additional data based on user role
        const requests: any = {
          stats: this.usersService.getUserStats(userId).pipe(
            catchError(error => {
              console.error('Error loading user stats', error);
              this.statsError = 'Impossible de charger les statistiques de l\'utilisateur.';
              return of(null);
            })
          )
        };

        // If user is a pharmacy owner, load their pharmacies
        if (user.role === UserRole.PHARMACY_OWNER) {
          requests.pharmacies = this.usersService.getUserPharmacies(userId).pipe(
            catchError(error => {
              console.error('Error loading user pharmacies', error);
              this.pharmaciesError = 'Impossible de charger les pharmacies de l\'utilisateur.';
              return of([]);
            })
          );
        }

        // Load user orders
        requests.orders = this.usersService.getUserOrders(userId).pipe(
          catchError(error => {
            console.error('Error loading user orders', error);
            this.ordersError = 'Impossible de charger les commandes de l\'utilisateur.';
            return of({ data: [], total: 0 });
          })
        );

        return forkJoin(requests);
      }),
      switchMap(results => {
        if (results) {
          this.userStats = results.stats;
          if (results.pharmacies) {
            this.userPharmacies = results.pharmacies;
          }
          this.userOrders = results.orders;
        }
        
        this.statsLoading = false;
        this.pharmaciesLoading = false;
        this.ordersLoading = false;
        
        return of(results);
      })
    );
  }

  editUser(): void {
    if (this.userId) {
      this.router.navigate(['/users', this.userId, 'edit']);
    }
  }

  updateRole(role: UserRole): void {
    if (!this.userId) return;
    
    this.usersService.updateUserRole(this.userId, role).subscribe(
      updatedUser => {
        this.user = updatedUser;
        this.snackBar.open(`Rôle mis à jour: ${role}`, 'Fermer', {
          duration: 3000
        });
      },
      error => {
        console.error('Error updating user role', error);
        this.snackBar.open('Impossible de mettre à jour le rôle. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  disableUser(): void {
    if (!this.userId) return;
    
    this.usersService.disableUser(this.userId).subscribe(
      updatedUser => {
        this.user = updatedUser;
        this.snackBar.open('Utilisateur désactivé avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error => {
        console.error('Error disabling user', error);
        this.snackBar.open('Impossible de désactiver l\'utilisateur. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  enableUser(): void {
    if (!this.userId) return;
    
    this.usersService.enableUser(this.userId).subscribe(
      updatedUser => {
        this.user = updatedUser;
        this.snackBar.open('Utilisateur activé avec succès', 'Fermer', {
          duration: 3000
        });
      },
      error => {
        console.error('Error enabling user', error);
        this.snackBar.open('Impossible d\'activer l\'utilisateur. Veuillez réessayer.', 'Fermer', {
          duration: 3000
        });
      }
    );
  }

  getStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'status-active';
      case UserStatus.INACTIVE:
        return 'status-inactive';
      case UserStatus.PENDING:
        return 'status-pending';
      case UserStatus.SUSPENDED:
        return 'status-suspended';
      default:
        return '';
    }
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.PHARMACY_OWNER:
        return 'role-owner';
      case UserRole.PHARMACY_STAFF:
        return 'role-staff';
      case UserRole.DELIVERY_PERSON:
        return 'role-delivery';
      case UserRole.CUSTOMER:
        return 'role-customer';
      default:
        return '';
    }
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  viewPharmacy(id: number): void {
    this.router.navigate(['/pharmacies', id]);
  }

  viewOrder(id: number): void {
    this.router.navigate(['/orders', id]);
  }
}