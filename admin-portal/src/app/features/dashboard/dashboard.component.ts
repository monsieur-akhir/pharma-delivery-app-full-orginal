import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { saveAs } from 'file-saver';
import { formatDate } from '@angular/common';
import { Observable, Subject, forkJoin, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

import { DashboardService, DashboardStats, ChartData } from './dashboard.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { StatsService } from '../../core/services/api/stats.service';
import { OrderService } from '../../core/services/api/order.service';
import { PharmacyService } from '../../core/services/api/pharmacy.service';
import { UserService } from '../../core/services/api/user.service';
import { StockService } from '../../core/services/api/stock.service';
import { StockAlertsDashboardComponent } from '../stock/stock-alerts-dashboard/stock-alerts-dashboard.component';
import { Role } from '@core/auth/rbac.model';

// Define a simple notification service with Angular decorator
@Injectable()
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}

// Define Order interface
interface Order {
  id: number;
  userId: number;
  items: any[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'delivered';
}

interface OrderTableItem {
  id: string | number;
  customer: string;
  items: number;
  total: number;
  status: string;
  date?: Date;
}

interface AuditLog {
  id: string | number;
  timestamp: Date;
  user: string;
  action: string;
  entity: string;
  details: string;
}

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatMenuModule,
    MatTableModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterModule,
    StockAlertsDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [NotificationService]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Error state
  error: string | null = null;

  // Dashboard stats structure required by the template
  dashboardStats: {
    users: {
      total: number;
      growth: number;
      newToday: number;
      activeRate: number;
    };
    pharmacies: {
      total: number;
      growth: number;
      pending: number;
      active: number;
    };
    orders: {
      total: number;
      growth: number;
      pending: number;
      delivered: number;
      totalSales: number;
    };
    medicines: {
      total: number;
      lowStock: number;
      outOfStock: number;
      mostOrdered: string;
    };
  } = {
    users: { total: 0, growth: 0, newToday: 0, activeRate: 0 },
    pharmacies: { total: 0, growth: 0, pending: 0, active: 0 },
    orders: { total: 0, growth: 0, pending: 0, delivered: 0, totalSales: 0 },
    medicines: { total: 0, lowStock: 0, outOfStock: 0, mostOrdered: '' }
  };

  // Audit logs
  auditLogDataSource: AuditLog[] = [];
  auditLogColumns: string[] = ['timestamp', 'user', 'action', 'entity', 'details'];
  auditLogTotal: number = 0;
  auditLogPageSize: number = 10;

  // Additional properties
  auditLogCurrentPage: number = 0;

  // Statistiques
  totalMedicines = 0;
  activeDeliveries = 0;
  totalUsers = 0;
  totalPharmacies = 0;
  totalRevenue = 0;
  dailyGrowth = 0;

  // Graphiques
  @ViewChild('ordersChart') ordersChartRef!: ElementRef;
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;
  @ViewChild('usersChart') usersChartRef!: ElementRef;

  // Période sélectionnée pour les données
  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly';

  // Tableaux de données
  recentOrders: OrderTableItem[] = [];
  orderColumns = ['id', 'customer', 'items', 'total', 'status', 'actions'];

  // Alertes de stock
  lowStockAlerts: any[] = [];

  // Activités récentes
  recentActivities: any[] = [];

  // Contrôle de chargement
  private destroy$ = new Subject<void>();
  private subscriptions = new Subscription();
  isLoading = true;
  loadingCharts = true;

  constructor(
    private api: ApiService,
    private statsService: StatsService,
    private orderService: OrderService,
    private pharmacyService: PharmacyService,
    private userService: UserService,
    private dashboardService: DashboardService,
    private errorHandler: ErrorHandlerService,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private stockService: StockService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRecentOrders();
    this.loadLowStockAlerts();
    this.loadRecentActivities();
    this.loadAuditLogs();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  onPeriodChange(): void {
    // Destroy existing charts to prevent memory leaks
    this.destroyCharts();
    // Reinitialize charts with new data
    this.initializeCharts();
  }

  // Méthode pour obtenir la classe CSS de tendance
  getTrendClass(value: number): string {
    if (value > 0) return 'trend-up';
    if (value < 0) return 'trend-down';
    return 'trend-neutral';
  }

  // Méthode pour obtenir l'icône de tendance
  getTrendIcon(value: number): string {
    if (value > 0) return 'trending_up';
    if (value < 0) return 'trending_down';
    return 'trending_flat';
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Utilisation de forkJoin pour charger plusieurs sources de données en parallèle
    this.subscriptions.add(
      forkJoin({
        stats: this.statsService.getDashboardStats(this.selectedPeriod),
        pharmacies: this.pharmacyService.getPharmacies(1, 1),
        medicines: this.api.orders.getOrders(1, 1) // Simulé, besoin d'un service médicament
      }).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (results) => {
          const stats = results.stats;
          
          // Mise à jour des variables individuelles
          this.totalUsers = stats.totalUsers || 0;
          this.activeDeliveries = stats.pendingOrders || 0;
          this.totalPharmacies = results.pharmacies.total || 0;
          this.totalMedicines = 1245; // Simulé, à remplacer par un service médicament
          this.totalRevenue = stats.totalRevenue || 0;
          this.dailyGrowth = stats.data?.growthRate || 2.5;
          
          // Mise à jour de la structure dashboardStats pour le template
          this.dashboardStats = {
            users: {
              total: stats.totalUsers || 0,
              growth: stats.data?.userGrowth || 3.2,
              newToday: stats.data?.newUsersToday || 12,
              activeRate: stats.data?.activeUserRate || 68
            },
            pharmacies: {
              total: results.pharmacies.total || 0,
              growth: stats.data?.pharmacyGrowth || 1.5,
              pending: stats.data?.pendingPharmacies || 3,
              active: results.pharmacies.total - (stats.data?.pendingPharmacies || 3)
            },
            orders: {
              total: stats.totalOrders || 0,
              growth: stats.data?.orderGrowth || 4.7,
              pending: stats.pendingOrders || 0,
              delivered: stats.completedOrders || 0,
              totalSales: stats.totalRevenue || 0
            },
            medicines: {
              total: this.totalMedicines,
              lowStock: 5,
              outOfStock: 2,
              mostOrdered: 'Paracétamol 500mg'
            }
          };
          
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.isLoading = false;
          this.error = "Impossible de charger les données du tableau de bord";
          this.showErrorNotification('Impossible de charger les données du tableau de bord');
        }
      })
    );
  }

  // Méthode pour charger les logs d'audit
  loadAuditLogs(page: number = 0): void {
    this.subscriptions.add(
      this.dashboardService.getAuditLogs(page, this.auditLogPageSize)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: {data: AuditLog[], total: number}) => {
            this.auditLogDataSource = response.data;
            this.auditLogTotal = response.total;
          },          error: (error: any) => {
            this.notificationService.showError('Erreur lors du chargement des logs d\'audit');
            console.error('Audit logs loading error:', error);
          }
        })
    );
  }
  
  // Méthode de gestion du changement de page pour les logs d'audit
  onAuditLogPageChange(event: any): void {
    this.auditLogCurrentPage = event.pageIndex || 0;
    this.loadAuditLogs(this.auditLogCurrentPage);
  }

  loadChartData(): void {
    this.loadingCharts = true;

    this.subscriptions.add(
      this.dashboardService.getChartData(this.selectedPeriod).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (chartData) => {
          this.renderOrdersChart(chartData.orders);
          this.renderRevenueChart(chartData.revenue);
          this.renderUsersChart(chartData.users);
          this.loadingCharts = false;
        },        error: (error) => {
          this.notificationService.showError('Erreur lors du chargement des données des graphiques');
          this.loadingCharts = false;
          console.error('Chart data loading error:', error);
        }
      })
    );
  }

  renderOrdersChart(data: any): void {
    if (!this.ordersChartRef) return;
    
    // Implement chart rendering logic here
    // This is a placeholder - you'll need to use your specific chart library
    console.log('Rendering orders chart with data:', data);
  }

  renderRevenueChart(data: any): void {
    if (!this.revenueChartRef) return;
    
    // Implement chart rendering logic here
    console.log('Rendering revenue chart with data:', data);
  }

  renderUsersChart(data: any): void {
    if (!this.usersChartRef) return;
    
    // Implement chart rendering logic here
    console.log('Rendering users chart with data:', data);
  }

  destroyCharts(): void {
    // Implement chart cleanup logic here
    // This will depend on the charting library you're using
    // Example for Chart.js:
    // if (this.ordersChartInstance) this.ordersChartInstance.destroy();
    // if (this.revenueChartInstance) this.revenueChartInstance.destroy();
    // if (this.usersChartInstance) this.usersChartInstance.destroy();
  }

  initializeCharts(): void {
    this.loadingCharts = true;
    
    this.subscriptions.add(
      this.dashboardService.getChartData(this.selectedPeriod)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (chartData: {orders: any, revenue: any, users: any}) => {
            this.renderOrdersChart(chartData.orders);
            this.renderRevenueChart(chartData.revenue);
            this.renderUsersChart(chartData.users);
            this.loadingCharts = false;
          },          error: (error: any) => {
            this.notificationService.showError('Erreur lors du chargement des données des graphiques');
            this.loadingCharts = false;
            console.error('Chart data loading error:', error);
          }
        })
    );
  }

  loadRecentOrders(): void {
    this.subscriptions.add(
      this.orderService.getOrders(1, 5).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (data) => {
          this.recentOrders = data.orders.map(order => ({
            id: Number(order.id),
            customer: `Client #${order.userId}`,
            items: order.items.length,
            total: order.totalPrice,
            status: this.getStatusLabel(order.status),
            date: new Date(order.createdAt)
          }));
        },
        error: (error) => {
          this.errorHandler.handleError(error);
          this.error = "Impossible de charger les commandes récentes";
          this.showErrorNotification('Impossible de charger les commandes récentes');
        }
      })
    );
  }
  loadLowStockAlerts(): void {
    // Utilisez maintenant le service StockService pour charger les alertes réelles
    // Les alertes sont maintenant gérées par le composant StockAlertsDashboardComponent
    // Mais nous devons toujours mettre à jour les statistiques du tableau de bord
    
    const currentUser = this.authService.getCurrentUser();
    const isPharmacyUser = currentUser?.roles.some((r: string) => r === Role.PHARMACIST || r === Role.PHARMACY_STAFF);
    
    if (isPharmacyUser && currentUser?.pharmacyId) {
      // Si c'est un utilisateur de pharmacie, chargez uniquement ses alertes
      this.subscriptions.add(
        this.stockService.getStockAlerts(currentUser.pharmacyId).subscribe({
          next: (alerts: any[]) => {
            // Mettre à jour les statistiques pour le tableau de bord
            this.dashboardStats.medicines.lowStock = alerts.filter((a: any) => a.type === 'LOW').length;
            this.dashboardStats.medicines.outOfStock = 0; // Géré différemment dans notre modèle
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des alertes de stock', error);
          }
        })
      );
    } else {
      // Pour les admins, chargez toutes les alertes
      this.subscriptions.add(
        this.stockService.getAllStockAlerts().subscribe({
          next: (alerts: any[]) => {
            // Mettre à jour les statistiques pour le tableau de bord
            this.dashboardStats.medicines.lowStock = alerts.filter((a: any) => a.type === 'LOW').length;
            this.dashboardStats.medicines.outOfStock = 0; // Géré différemment dans notre modèle
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des alertes de stock', error);
          }
        })
      );
    }
  }

  loadRecentActivities(): void {
    // Simulating data for now - this should be replaced with a real API call
    this.recentActivities = [
      { id: 1, user: 'Philippe Durand', action: 'a ajouté', entity: 'un nouveau médicament', timestamp: new Date(Date.now() - 3600000) },
      { id: 2, user: 'Emma Martin', action: 'a confirmé', entity: 'la livraison #32145', timestamp: new Date(Date.now() - 7200000) },
      { id: 3, user: 'Sophie Bernard', action: 'a mis à jour', entity: 'le stock de Doliprane', timestamp: new Date(Date.now() - 10800000) }
    ];
  }

  getStatusLabel(status: Order['status']): string {
    const labels = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'completed': 'Livré',
      'cancelled': 'Annulé',
      'delivered': 'Livré'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'delivered': 'completed'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'pending';
  }

  exportData(type: string): void {
    this.isLoading = true;
    let exportSub: Subscription;

    switch (type) {
      case 'users':
        exportSub = this.dashboardService.exportData('users').subscribe(this.handleExport('utilisateurs'));
        break;
      case 'pharmacies':
        exportSub = this.dashboardService.exportData('pharmacies').subscribe(this.handleExport('pharmacies'));
        break;
      case 'orders':
        exportSub = this.dashboardService.exportData('orders').subscribe(this.handleExport('commandes'));
        break;
      case 'medicines':
        exportSub = this.dashboardService.exportData('medicines').subscribe(this.handleExport('médicaments'));
        break;
      case 'audit-logs':
        exportSub = this.dashboardService.exportData('audit-logs').subscribe(this.handleExport('logs d\'audit'));
        break;
      default:
        this.isLoading = false;
        this.showErrorNotification('Type d\'export inconnu');
        return;
    }

    this.subscriptions.add(exportSub);
  }

  private handleExport(entityName: string) {
    return {
      next: (blob: Blob) => {
        const date = formatDate(new Date(), 'yyyy-MM-dd', 'fr');
        saveAs(blob, `export-${entityName}-${date}.xlsx`);
        this.isLoading = false;
        this.showSuccessNotification(`Les ${entityName} ont été exportés avec succès`);
      },
      error: (error: any) => {
        this.errorHandler.handleError(error);
        this.isLoading = false;
        this.error = `Impossible d'exporter les ${entityName}`;
        this.showErrorNotification(`Impossible d'exporter les ${entityName}`);
      }
    };
  }

  viewOrderDetails(orderId: number): void {
    // Naviguer vers les détails de la commande (à implémenter avec Router)
    console.log(`Afficher les détails de la commande ${orderId}`);
  }

  manageStock(): void {
    // Naviguer vers la gestion des stocks (à implémenter avec Router)
    console.log('Gérer les stocks');
  }

  orderMedicine(medicineName: string): void {
    // Commander un médicament (à implémenter)
    console.log(`Commander ${medicineName}`);
    this.showSuccessNotification(`Commande de ${medicineName} initiée`);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
    this.loadChartData();
    this.loadRecentOrders();
    this.loadLowStockAlerts();
    this.loadRecentActivities();
    this.loadAuditLogs();
  }

  private showSuccessNotification(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorNotification(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  handleOrderAction(action: string, order: any): void {
    console.log(`Action ${action} on order:`, order);
    // Implement the action handling logic
    this.notificationService.showSuccess(`Action "${action}" effectuée sur la commande #${order.id}`);
  }

  refresh(): void {
    this.loadDashboardData();
    this.loadAuditLogs();
    this.loadRecentOrders();
    this.loadLowStockAlerts();
    this.loadRecentActivities();
    this.destroyCharts();
    this.initializeCharts();
    this.notificationService.showSuccess('Données du tableau de bord actualisées');
  }
}

// NotificationService is defined at the top of the file
