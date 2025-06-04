import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface AuditLogFilter {
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) { }

  /**
   * Get audit logs with pagination and optional filtering
   */
  getAuditLogs(
    page: number = 1, 
    limit: number = 10,
    filters?: AuditLogFilter
  ): Observable<{ data: AuditLog[], total: number }> {
    let params: any = {
      page: page.toString(),
      limit: limit.toString()
    };

    // Add filters if provided
    if (filters) {
      if (filters.userId) params.userId = filters.userId.toString();
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId.toString();
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }

    return this.http.get<{ data: AuditLog[], total: number }>(this.apiUrl, { params });
  }

  /**
   * Get specific audit log by ID
   */
  getAuditLog(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get available action types for filtering
   */
  getActionTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/actions`);
  }

  /**
   * Get available entity types for filtering
   */
  getEntityTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/entity-types`);
  }

  /**
   * Export audit logs as CSV
   */
  exportAuditLogsCSV(filters?: AuditLogFilter): Observable<Blob> {
    let params: any = {};

    // Add filters if provided
    if (filters) {
      if (filters.userId) params.userId = filters.userId.toString();
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId.toString();
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}