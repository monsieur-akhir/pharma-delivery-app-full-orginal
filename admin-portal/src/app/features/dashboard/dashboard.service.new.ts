import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StatsService } from '../../core/services/api/stats.service';
import { OrderService } from '../../core/services/api/order.service';
import { PharmacyService } from '../../core/services/api/pharmacy.service';
import { UserService } from '../../core/services/api/user.service';

export interface DashboardStats {
  pharmacies: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  users: {
    total: number;
    newToday: number;
    activeRate: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    delivered: number;
    totalSales: number;
    growth: number;
  };
  medicines: {
    total: number;
    lowStock: number;
    outOfStock: number;
    mostOrdered: string;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[] | string;
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: string;
  ipAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(
    private http: HttpClient,
    private statsService: StatsService,
    private orderService: OrderService,
    private pharmacyService: PharmacyService,
    private userService: UserService
  ) { }

  /**
   * Obtenir toutes les données du tableau de bord en une seule requête
   */
  getDashboardData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Observable<any> {
    return forkJoin({
      stats: this.statsService.getDashboardStats(period),
      recentOrders: this.orderService.getOrders(1, 5),
      usersStats: this.statsService.getUsersStats(period),
      revenueStats: this.statsService.getRevenueStats(period),
      pharmacies: this.pharmacyService.getPharmacies(1, 5),
      topMedicines: this.http.get<any>(`${this.apiUrl}/top-medicines`).pipe(
        catchError(() => of({ medicines: [] }))
      ),
      auditLogs: this.getRecentAuditLogs(10)
    }).pipe(
      catchError(error => {
        console.error('Error fetching dashboard data', error);
        throw new Error('Échec du chargement des données du tableau de bord. Veuillez réessayer plus tard.');
      })
    );
  }

  /**
   * Récupérer les statistiques du tableau de bord
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
      catchError(error => {
        console.error('Error fetching dashboard stats', error);
        throw new Error('Failed to load dashboard statistics. Please try again later.');
      })
    );
  }

  /**
   * Données des commandes quotidiennes pour les 30 derniers jours
   */
  getOrdersChartData(): Observable<ChartData> {
    return this.http.get<any>(`${this.apiUrl}/charts/orders`).pipe(
      map(data => {
        return {
          labels: data.labels,
          datasets: [
            {
              label: 'Commandes',
              data: data.orders,
              borderColor: '#3f51b5',
              borderWidth: 2,
              fill: false
            }
          ]
        };
      }),
      catchError(() => {
        // Générer des données fictives en cas d'erreur
        const labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - 29 + i);
          return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        });
        return of({
          labels,
          datasets: [{
            label: 'Commandes',
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10),
            borderColor: '#3f51b5',
            borderWidth: 2,
            fill: false
          }]
        });
      })
    );
  }

  /**
   * Données des revenus pour les périodes sélectionnées
   */
  getRevenueChartData(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<ChartData> {
    return this.statsService.getRevenueStats(period).pipe(
      map(data => {
        return {
          labels: data.labels,
          datasets: [
            {
              label: 'Revenus',
              data: data.values,
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderWidth: 2,
              fill: true
            }
          ]
        };
      }),
      catchError(() => {
        // Données fictives en cas d'erreur
        const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return of({
          labels,
          datasets: [{
            label: 'Revenus',
            data: labels.map(() => Math.floor(Math.random() * 10000) + 5000),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            borderWidth: 2,
            fill: true
          }]
        });
      })
    );
  }

  /**
   * Distribution des utilisateurs par rôle
   */
  getUsersDistributionData(): Observable<ChartData> {
    return this.http.get<any>(`${this.apiUrl}/charts/users-distribution`).pipe(
      map(data => {
        return {
          labels: data.labels,
          datasets: [
            {
              label: 'Utilisateurs par rôle',
              data: data.values,
              backgroundColor: [
                '#3f51b5',
                '#f44336',
                '#4caf50',
                '#ff9800',
                '#9c27b0',
                '#607d8b'
              ]
            }
          ]
        };
      }),
      catchError(() => {
        // Données fictives en cas d'erreur
        const labels = ['Client', 'Pharmacien', 'Livreur', 'Admin', 'Personnel pharmacie'];
        return of({
          labels,
          datasets: [{
            label: 'Utilisateurs par rôle',
            data: labels.map(() => Math.floor(Math.random() * 100) + 20),
            backgroundColor: [
              '#3f51b5',
              '#f44336',
              '#4caf50',
              '#ff9800',
              '#9c27b0'
            ]
          }]
        });
      })
    );
  }

  /**
   * Distribution des commandes par statut
   */
  getOrdersDistributionData(): Observable<ChartData> {
    return this.http.get<any>(`${this.apiUrl}/charts/orders-distribution`).pipe(
      map(data => {
        return {
          labels: data.labels,
          datasets: [
            {
              label: 'Commandes par statut',
              data: data.values,
              backgroundColor: [
                '#4caf50', // Livré
                '#ff9800', // En cours
                '#f44336', // Annulé
                '#3f51b5', // En attente
                '#9c27b0'  // Autres
              ]
            }
          ]
        };
      }),
      catchError(() => {
        // Données fictives en cas d'erreur
        const labels = ['Livré', 'En cours', 'Annulé', 'En attente', 'Préparation'];
        return of({
          labels,
          datasets: [{
            label: 'Commandes par statut',
            data: labels.map(() => Math.floor(Math.random() * 50) + 10),
            backgroundColor: [
              '#4caf50',
              '#ff9800',
              '#f44336',
              '#3f51b5',
              '#9c27b0'
            ]
          }]
        });
      })
    );
  }

  /**
   * Récupérer les journaux d'audit récents
   */
  getRecentAuditLogs(limit: number = 10): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, {
      params: { limit: limit.toString() }
    }).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Obtenir les KPIs pour le tableau de bord
   */
  getKPIs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/kpis`).pipe(
      catchError(() => of({
        totalUsers: 0,
        totalPharmacies: 0,
        totalOrders: 0,
        totalMedicines: 0,
        revenueThisMonth: 0,
        ordersToday: 0
      }))
    );
  }

  /**
   * Exporter des données du tableau de bord
   */
  exportData(type: 'users' | 'pharmacies' | 'orders' | 'medicines' | 'audit-logs'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/${type}`, { responseType: 'blob' }).pipe(
      catchError(error => {
        console.error(`Error exporting ${type} data`, error);
        throw new Error(`Échec de l'exportation des données ${type}. Veuillez réessayer plus tard.`);
      })
    );
  }
}
