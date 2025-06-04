import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reminder } from '../../../shared/models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {  private baseUrl = `${environment.apiUrl}/v1/api/reminders`;

  constructor(private http: HttpClient) {}

  getAllReminders(page: number = 1, limit: number = 10, status?: string): Observable<{ reminders: Reminder[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ reminders: Reminder[], total: number }>(`${this.baseUrl}`, { params });
  }

  getReminderById(id: string): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.baseUrl}/${id}`);
  }

  getRemindersForUser(userId: string): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.baseUrl}/user/${userId}`);
  }

  createReminder(reminder: Partial<Reminder>): Observable<Reminder> {
    return this.http.post<Reminder>(`${this.baseUrl}`, reminder);
  }

  updateReminder(id: string, reminder: Partial<Reminder>): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.baseUrl}/${id}`, reminder);
  }

  deleteReminder(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  cancelReminder(id: string): Observable<Reminder> {
    return this.http.patch<Reminder>(`${this.baseUrl}/${id}/cancel`, {});
  }

  sendReminderNow(id: string): Observable<{ success: boolean, message: string }> {
    return this.http.post<{ success: boolean, message: string }>(`${this.baseUrl}/${id}/send-now`, {});
  }
}
