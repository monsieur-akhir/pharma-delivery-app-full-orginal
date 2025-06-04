import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Pharmacy, PharmacyListItem, PharmacyStats, PharmacyStaffMember } from '../../models/pharmacy.model';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {  private baseUrl = `${environment.apiUrl}/v1/admin/pharmacies`;

  constructor(private http: HttpClient) {}

  getPharmacies(page: number = 1, limit: number = 10, status?: string): Observable<{ pharmacies: PharmacyListItem[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ pharmacies: PharmacyListItem[], total: number }>(`${this.baseUrl}/search`, { params });
  }

  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.http.get<Pharmacy>(`${this.baseUrl}/${id}`);
  }

  getPharmacyStats(id: number): Observable<PharmacyStats> {
    return this.http.get<PharmacyStats>(`${this.baseUrl}/${id}/stats`);
  }

  createPharmacy(pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.post<Pharmacy>(`${this.baseUrl}`, pharmacy);
  }

  updatePharmacy(id: number, pharmacy: Partial<Pharmacy>): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}`, pharmacy);
  }

  deletePharmacy(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  approvePharmacy(id: number): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectPharmacy(id: number, reason: string): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/reject`, { reason });
  }

  suspendPharmacy(id: number, reason: string): Observable<Pharmacy> {
    return this.http.patch<Pharmacy>(`${this.baseUrl}/${id}/suspend`, { reason });
  }

  getPharmacyStaff(pharmacyId: number): Observable<PharmacyStaffMember[]> {
    return this.http.get<PharmacyStaffMember[]>(`${this.baseUrl}/${pharmacyId}/staff`);
  }

  addPharmacyStaff(pharmacyId: number, userId: number, role: string): Observable<PharmacyStaffMember> {
    return this.http.post<PharmacyStaffMember>(`${this.baseUrl}/${pharmacyId}/staff`, { userId, role });
  }

  removePharmacyStaff(pharmacyId: number, staffId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${pharmacyId}/staff/${staffId}`);
  }
}
