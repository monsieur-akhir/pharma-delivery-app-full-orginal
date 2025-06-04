import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Notification } from '../../../shared/models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {  private baseUrl = `${environment.apiUrl}/v1/api/notifications`;

  constructor(private http: HttpClient) {}

  getAllNotifications(page: number = 1, limit: number = 10, type?: string): Observable<{ notifications: Notification[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (type) {
      params = params.set('type', type);
    }

    return this.http.get<{ notifications: Notification[], total: number }>(`${this.baseUrl}`, { params });
  }

  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.baseUrl}/${id}`);
  }

  getNotificationsForUser(userId: string, read?: boolean): Observable<Notification[]> {
    let params = new HttpParams();

    if (read !== undefined) {
      params = params.set('read', read.toString());
    }

    return this.http.get<Notification[]>(`${this.baseUrl}/user/${userId}`, { params });
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllAsRead(userId: string): Observable<{ success: boolean, count: number }> {
    return this.http.post<{ success: boolean, count: number }>(`${this.baseUrl}/user/${userId}/read-all`, {});
  }

  createSystemNotification(title: string, message: string, userIds?: string[]): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.baseUrl}/system`, { title, message, userIds });
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
