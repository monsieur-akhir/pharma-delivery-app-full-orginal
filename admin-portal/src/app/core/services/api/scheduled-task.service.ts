import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ScheduledTask } from '../../../shared/models/scheduled-task.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduledTaskService {  private baseUrl = `${environment.apiUrl}/v1/api/scheduled-tasks`;

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<ScheduledTask[]> {
    return this.http.get<ScheduledTask[]>(`${this.baseUrl}`);
  }

  getTaskById(id: string): Observable<ScheduledTask> {
    return this.http.get<ScheduledTask>(`${this.baseUrl}/${id}`);
  }

  createTask(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(`${this.baseUrl}`, task);
  }

  updateTask(id: string, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.patch<ScheduledTask>(`${this.baseUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  activateTask(id: string): Observable<ScheduledTask> {
    return this.http.patch<ScheduledTask>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivateTask(id: string): Observable<ScheduledTask> {
    return this.http.patch<ScheduledTask>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  executeTaskNow(id: string): Observable<{ success: boolean, message: string }> {
    return this.http.post<{ success: boolean, message: string }>(`${this.baseUrl}/${id}/execute`, {});
  }
}
