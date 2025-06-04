import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { User, UserListItem, UserStats } from '../../models/user.model';
import { User as SharedUser } from '../../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/v1/api/admin/users`;

  constructor(private http: HttpClient) {}

  getUsers(page: number = 1, limit: number = 10, role?: string, status?: string): Observable<{ users: UserListItem[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (role) {
      params = params.set('role', role);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ users: UserListItem[], total: number }>(`${this.baseUrl}`, { params });
  }

  getUsersByPharmacy(pharmacyId: number, page: number = 1, limit: number = 10): Observable<{ users: SharedUser[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('pharmacyId', pharmacyId.toString());
    
    return this.http.get<{ users: any[], total: number }>(`${this.baseUrl}/pharmacy`, { params })
      .pipe(
        map(response => {
          // Convertir les utilisateurs du modèle API vers le modèle shared
          const sharedUsers: SharedUser[] = response.users.map(user => ({
            id: String(user.id),
            username: user.username,
            email: user.email || '',
            phone: user.phone || '',
            role: this.mapRoleToSharedType(user.role),
            isActive: user.status === 'ACTIVE',
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ')[1] || '',
            createdAt: user.createdAt,
            updatedAt: new Date(),
            pharmacyId: String(pharmacyId)
          }));
          
          return {
            users: sharedUsers,
            total: response.total
          };
        })
      );
  }
  
  private mapRoleToSharedType(apiRole: string): SharedUser['role'] {
    // Map from API role to shared model role
    switch (apiRole) {
      case 'ADMIN':
        return 'ADMIN';
      case 'PHARMACY_OWNER':
        return 'PHARMACY_STAFF';
      case 'PHARMACY_STAFF':
        return 'PHARMACY_STAFF';
      case 'PHARMACIST':
        return 'PHARMACIST';
      case 'DELIVERY_PERSON':
        return 'DELIVERY_PERSON';
      case 'CUSTOMER':
        return 'CUSTOMER';
      case 'SUPER_ADMIN':
        return 'SUPER_ADMIN';
      case 'MANAGER':
        return 'MANAGER';
      case 'SUPPORT':
        return 'SUPPORT';
      default:
        return 'VIEWER';
    }
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  getUserStats(id: number): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.baseUrl}/${id}/stats`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  resetUserPassword(id: number): Observable<{ success: boolean, message: string }> {
    return this.http.post<{ success: boolean, message: string }>(`${this.baseUrl}/${id}/reset-password`, {});
  }

  suspendUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/suspend`, {});
  }

  activateUser(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/activate`, {});
  }
}
