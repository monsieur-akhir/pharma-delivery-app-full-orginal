import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Stats } from '../../../shared/models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {  private baseUrl = `${environment.apiUrl}/v1/admin/stats`;

  constructor(private http: HttpClient) {}

  getDashboardStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Observable<Stats> {
    let params = new HttpParams().set('period', period);
    return this.http.get<Stats>(`${this.baseUrl}/dashboard`, { params });
  }

  getUsersStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    let params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.baseUrl}/users`, { params });
  }

  getOrdersStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    let params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.baseUrl}/orders`, { params });
  }

  getRevenueStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    let params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.baseUrl}/revenue`, { params });
  }

  getPharmacyPerformanceStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pharmacy-performance`);
  }

  getDeliveryEfficiencyStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/delivery-efficiency`);
  }

  getPrescriptionStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Observable<any> {
    let params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.baseUrl}/prescriptions`, { params });
  }
}
