import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserListItem, UserRole, UserStatus, User } from '../../core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/api/v1/api/admin/users`;

  constructor(private http: HttpClient) { }

  getUsers(params: {
    page?: number,
    limit?: number,
    role?: UserRole,
    status?: UserStatus,
    search?: string
  } = {}): Observable<{ items: UserListItem[], total: number }> {
    return this.http.get<{ items: UserListItem[], total: number }>(this.apiUrl, { params: { ...params } as any });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData);
  }

  updateUserRole(id: number, role: UserRole): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/role`, { role });
  }

  updateUserStatus(id: number, status: UserStatus): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}