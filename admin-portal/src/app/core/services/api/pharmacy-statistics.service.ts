import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PharmacyStatistics } from '../../../shared/models/pharmacy-statistics.model';

@Injectable({
  providedIn: 'root'
})
export class PharmacyStatisticsService {  private baseUrl = `${environment.apiUrl}/v1/api/pharmacy-statistics`;

  constructor(private http: HttpClient) {}

  getAllStatistics(page: number = 1, limit: number = 10, period?: string): Observable<{ statistics: PharmacyStatistics[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<{ statistics: PharmacyStatistics[], total: number }>(`${this.baseUrl}`, { params });
  }

  getStatisticsForPharmacy(pharmacyId: string, period?: string): Observable<PharmacyStatistics[]> {
    let params = new HttpParams();

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<PharmacyStatistics[]>(`${this.baseUrl}/pharmacy/${pharmacyId}`, { params });
  }

  getStatisticsById(id: string): Observable<PharmacyStatistics> {
    return this.http.get<PharmacyStatistics>(`${this.baseUrl}/${id}`);
  }

  regenerateStatistics(pharmacyId: string, period: string): Observable<PharmacyStatistics> {
    return this.http.post<PharmacyStatistics>(`${this.baseUrl}/regenerate`, { pharmacyId, period });
  }
}
