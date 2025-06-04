import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VideoChat } from '../../../shared/models/video-chat.model';

@Injectable({
  providedIn: 'root'
})
export class VideoChatService {  private baseUrl = `${environment.apiUrl}/v1/api/video-chat`;

  constructor(private http: HttpClient) {}

  getAllSessions(status?: string): Observable<VideoChat[]> {
    let url = `${this.baseUrl}`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<VideoChat[]>(url);
  }

  getSessionById(id: string): Observable<VideoChat> {
    return this.http.get<VideoChat>(`${this.baseUrl}/${id}`);
  }

  createSession(data: Partial<VideoChat>): Observable<VideoChat> {
    return this.http.post<VideoChat>(`${this.baseUrl}`, data);
  }

  updateSession(id: string, data: Partial<VideoChat>): Observable<VideoChat> {
    return this.http.patch<VideoChat>(`${this.baseUrl}/${id}`, data);
  }

  endSession(id: string): Observable<VideoChat> {
    return this.http.post<VideoChat>(`${this.baseUrl}/${id}/end`, {});
  }

  generateToken(sessionId: string, role: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/${sessionId}/token`, { role });
  }
}
