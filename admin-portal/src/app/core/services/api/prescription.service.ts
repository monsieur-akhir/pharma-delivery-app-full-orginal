import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Prescription } from '../../../shared/models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {  private baseUrl = `${environment.apiUrl}/v1/api/prescriptions`;

  constructor(private http: HttpClient) {}

  getAllPrescriptions(page: number = 1, limit: number = 10, status?: string): Observable<{ prescriptions: Prescription[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ prescriptions: Prescription[], total: number }>(`${this.baseUrl}`, { params });
  }

  getPrescriptionById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.baseUrl}/${id}`);
  }

  getPrescriptionsForUser(userId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.baseUrl}/user/${userId}`);
  }

  verifyPrescription(id: string, verifiedBy: string, medications?: any[]): Observable<Prescription> {
    return this.http.patch<Prescription>(`${this.baseUrl}/${id}/verify`, { verifiedBy, medications });
  }

  rejectPrescription(id: string, rejectionReason: string): Observable<Prescription> {
    return this.http.patch<Prescription>(`${this.baseUrl}/${id}/reject`, { rejectionReason });
  }

  runOcr(id: string): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.baseUrl}/${id}/ocr`, {});
  }
}
